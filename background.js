var notification = false,
	notificationAvid = {},
	lastDyn = 0,
	playerTabs = {},
	cidHackType = {};

function getFileData(url, callback) {
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", url, true);
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			if (typeof callback == "function") callback(xmlhttp.responseText);
		}
	}
	xmlhttp.send();
}

function postFileData(url, data, callback) {
	var encodeData = "",
		append = false;
	Object.keys(data).forEach(function(key) {
		if (!append) {
			append = true;
		} else {
			encodeData += "&";
		}
		encodeData += encodeURIComponent(key).replace(/%20/g, "+") + "=" +
			encodeURIComponent(data[key]).replace(/%20/g, "+");
	});
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			if (typeof callback == "function") callback(xmlhttp.responseText);
		}
	}
	xmlhttp.send(encodeData);
}

function getUrlVars(url) {
	var vars = [],
		hash;
	var hashes = url.slice(url.indexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

function searchBilibili(info) {
	chrome.tabs.create({
		url: "http://www.bilibili.com/search?keyword=" + info.selectionText
	});
}

function notifyAllTabs(message) {
	chrome.windows.getAll({
		populate: true
	}, function(wins) {
		wins.forEach(function(win) {
			win.tabs.forEach(function(tab) {
				chrome.tabs.sendMessage(tab.id, message);
			});
		});
	});
}

function setIcon() {
	chrome.browserAction.setIcon({
		path: "imgs/icon-19.png"
	});
}

function updateAll() {
	notifyAllTabs({
		command: "update"
	});
	setIcon();
}

function enableAll() {
	setOption("enabled", true);
	updateAll();
}

function disableAll() {
	setOption("enabled", false);
	updateAll();
}

function checkDynamic() {
	if (getOption("dynamic") == "on") {
		getFileData("http://interface.bilibili.com/widget/getDynamic?pagesize=1", function(data) {
			var dynamic = JSON.parse(data),
				content = dynamic.list[0];
			if (typeof dynamic === "object" && typeof dynamic.num === "number") {
				if (dynamic.num > getOption("updates") && content.dyn_id != lastDyn) {
					if (notification) chrome.notifications.clear("bh-" + notification, function() {});
					notification = (new Date()).getTime();
					var message = chrome.i18n.getMessage('followingUpdateMessage')
						.replace('%n', dynamic.num)
						.replace('%uploader', content.uname)
						.replace('%title', content.title),
						icon = content.cover ? content.cover : "imgs/icon-128.png";
					notificationAvid["bh-" + notification] = content.aid;
					chrome.notifications.create("bh-" + notification, {
						type: "basic",
						iconUrl: icon,
						title: chrome.i18n.getMessage('noticeficationTitle'),
						message: message,
						isClickable: false,
						buttons: [{
							title: chrome.i18n.getMessage('notificationWatch')
						}, {
							title: chrome.i18n.getMessage('notificationShowAll')
						}]
					}, function() {});
					lastDyn = content.dyn_id;
				}
				setOption("updates", dynamic.num);
				if (getOption("updates") == 0 || content.dyn_id != lastDyn) {
					chrome.browserAction.setBadgeText({
						text: ""
					});
				} else {
					chrome.browserAction.setBadgeText({
						text: getOption("updates")
					});
				}
			}
		});
	}
}

function getCid(avid, callback) {
	if (typeof cidCache[avid] != "undefined") {
		callback(cidCache[avid], true);
		return true;
	}
	getFileData("http://api.bilibili.com/view?type=json&appkey=95acd7f6cc3392f3&id=" + avid + "&page=1", function(avInfo) {
		avInfo = JSON.parse(avInfo);
		if (typeof avInfo.code != "undefined" && avInfo.code == -503) {
			setTimeout(function() {
				getCid(avid, callback);
			}, 1000);
		} else {
			if (typeof avInfo.cid == "number") {
				cidCache[avid] = avInfo.cid;
				localStorage.setItem("cidCache", JSON.stringify(cidCache));
			}
			callback(avInfo.cid, false);
		}
	});
	return true;
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.command) {
		case "init":
			sendResponse({
				replace: getOption("replace"),
				html5: getOption("html5"),
				version: version,
				playerConfig: JSON.parse(getOption("playerConfig"))
			});
			return true;
		case "cidHack":
			playerTabs[sender.tab.id] = request.cid;
			cidHackType[request.cid] = request.type;
			sendResponse();
			return true;
		case "getOption":
			sendResponse({
				value: getOption(request.key)
			});
			return true;
		case "enableAll":
			enableAll();
			sendResponse({
				result: "ok"
			});
			return true;
		case "disableAll":
			disableAll();
			sendResponse({
				result: "ok"
			});
			return true;
		case "getCSS":
			if (getOption("enabled") == "true" || getOption("ad") != "keep") sendResponse({
				result: "ok",
				css: getCSS(request.url)
			});
			else sendResponse({
				result: "disabled"
			});
			return true;
		case "getVideoInfo":
			getFileData("http://api.bilibili.com/view?type=json&appkey=95acd7f6cc3392f3&id=" + request.avid + "&page=" + request.pg, function(avInfo) {
				avInfo = JSON.parse(avInfo);
				sendResponse({
					videoInfo: avInfo
				});
			});
			return true;
		case "getDownloadLink":
			var url = {
				download: "http://interface.bilibili.com/playurl?platform=bilihelper&otype=json&appkey=95acd7f6cc3392f3&cid=" + request.cid + "&quality=4&type=" + getOption("dlquality"),
				playback: "http://interface.bilibili.com/playurl?platform=bilihelper&otype=json&appkey=95acd7f6cc3392f3&cid=" + request.cid + "&quality=4&type=mp4"
			}
			if (request.cidHack == 2) {
				var url = {
					download: "https://bilibili.guguke.net/playurl.json?cid=" + request.cid + "&type=" + getOption("dlquality"),
					playback: "https://bilibili.guguke.net/playurl.json?cid=" + request.cid + "&type=mp4"
				}
			}
			getFileData(url["download"], function(avDownloadLink) {
				avDownloadLink = JSON.parse(avDownloadLink);
				if (getOption("dlquality") == 'mp4') {
					sendResponse({
						download: avDownloadLink,
						playback: avDownloadLink,
						dlquality: getOption("dlquality"),
						rel_search: getOption("rel_search")
					});
				} else {
					getFileData(url["playback"], function(avPlaybackLink) {
						avPlaybackLink = JSON.parse(avPlaybackLink);
						sendResponse({
							download: avDownloadLink,
							playback: avPlaybackLink,
							dlquality: getOption("dlquality"),
							rel_search: getOption("rel_search")
						});
					});
				}
			});
			return true;
		case "getMyInfo":
			getFileData("http://api.bilibili.com/myinfo", function(myinfo) {
				myinfo = JSON.parse(myinfo);
				if (typeof myinfo.code == undefined) myinfo.code = 200;
				sendResponse({
					code: myinfo.code || 200,
					myinfo: myinfo
				});
			});
			return true;
		case "searchVideo":
			var keyword = request.keyword;
			getFileData("http://api.bilibili.com/search?type=json&appkey=95acd7f6cc3392f3&keyword=" + encodeURIComponent(keyword) + "&page=1&order=ranklevel", function(searchResult) {
				searchResult = JSON.parse(searchResult);
				if (searchResult.code == 0) {
					sendResponse({
						status: "ok",
						result: searchResult.result[0]
					});
				} else {
					sendResponse({
						status: "error",
						code: searchResult.code,
						error: searchResult.error
					});
				}
			});
			return true;
		case "checkComment":
			getFileData("http://www.bilibili.com/feedback/arc-" + request.avid + "-1.html", function(commentData) {
				var test = commentData.indexOf('<div class="no_more">');
				if (test >= 0) {
					sendResponse({
						banned: true
					});
				} else {
					sendResponse({
						banned: false
					});
				}
			});
			return true;
		case "savePlayerConfig":
			sendResponse({
				result: setOption("playerConfig", JSON.stringify(request.config))
			});
			return true;
		case "sendComment":
			var errorCode = ["正常", "选择的弹幕模式错误", "用户被禁止", "系统禁止",
				"投稿不存在", "UP主禁止", "权限有误", "视频未审核/未发布", "禁止游客弹幕"
			];
			request.comment.cid = request.cid;
			postFileData("http://interface.bilibili.com/dmpost?cid=" + request.cid +
				"&aid=" + request.avid + "&pid=" + request.page, request.comment,
				function(result) {
					result = parseInt(result);
					if (result < 0) {
						sendResponse({
							result: false,
							error: errorCode[-result]
						});
					} else {
						sendResponse({
							result: true,
							id: result
						});
					}
				});
			return true;
		default:
			sendResponse({
				result: "unknown"
			});
			return false;
	}
});

if (localStorage.getItem("enabled") == null) {
	enableAll();
}

if (getOption("contextmenu") == "on") {
	chrome.contextMenus.create({
		title: chrome.i18n.getMessage('searchBili'),
		contexts: ["selection"],
		onclick: searchBilibili
	});
}

setIcon();

checkDynamic();

chrome.alarms.create("checkDynamic", {
	periodInMinutes: 1
});

if (getOption("version") < chrome.app.getDetails().version) {
	setOption("version", chrome.app.getDetails().version);
	chrome.tabs.create({
		url: chrome.extension.getURL('options.html#update')
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	switch (alarm.name) {
		case "checkDynamic":
			checkDynamic();
			return true;
		default:
			return false;
	}
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, index) {
	if (index == 0 && notificationAvid[notificationId]) {
		chrome.tabs.create({
			url: "http://www.bilibili.com/video/av" + notificationAvid[notificationId]
		});
	} else if (index == 1) {
		chrome.tabs.create({
			url: "http://www.bilibili.com/account/dynamic"
		});
	}
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	chrome.tabs.sendMessage(details.tabId, {
		command: "error"
	});
}, {
	urls: ["http://comment.bilibili.com/1272.xml"]
});

chrome.webRequest.onHeadersReceived.addListener(function(details) {
	var blockingResponse = {};
	if (getOption("replace") == "on") {
		if (details.url.indexOf('retry=1') < 0) {
			blockingResponse.redirectUrl = details.url + '&retry=1';
		}
	}
	return blockingResponse;
}, {
	urls: ["http://g3.letv.cn/vod/v2/*"]
}, ["blocking"]);

chrome.webRequest.onHeadersReceived.addListener(function(details) {
	var blockingResponse = {};
	if (getOption("replace") == "on" && details.url.indexOf("cid=" + playerTabs[details.tabId]) > 0) {
		playerTabs[details.tabId] = false;
		var params = getUrlVars(details.url);
		if (params['cid']) {
			if (cidHackType[params['cid']] == 1) {
				blockingResponse.redirectUrl = 'http://interface.bilibili.com/playurl?platform=bilihelper&cid=' + params['cid'] + '&appkey=95acd7f6cc3392f3';
			} else if (cidHackType[params['cid']] == 2) {
				blockingResponse.redirectUrl = 'https://bilibili.guguke.net/playurl.xml?cid=' + params['cid'];
			}
		}
	}
	return blockingResponse;
}, {
	urls: ["http://interface.bilibili.com/playurl?cid*", "http://interface.bilibili.com/playurl?accel=1&cid=*"]
}, ["blocking"]);

chrome.webRequest.onHeadersReceived.addListener(function(details) {
	var headers = details.responseHeaders,
		blockingResponse = {};
	if (details.statusLine == "HTTP/1.1 302 Moved Temporarily" && getOption("replace") == "on") {
		blockingResponse.responseHeaders = [];
		var redirectUrl = "";
		for (i in headers) {
			if (headers[i].name.toLowerCase() != "location") {
				blockingResponse.responseHeaders.push(headers[i]);
			} else {
				redirectUrl = headers[i]["value"];
			}
		}
		blockingResponse.responseHeaders.push({
			name: "Set-Cookie",
			value: "redirectUrl=" + encodeURIComponent(redirectUrl)
		})
	} else {
		blockingResponse.responseHeaders = headers;
	}
	return blockingResponse;
}, {
	urls: ["http://www.bilibili.com/video/av*"]
}, ["responseHeaders", "blocking"]);