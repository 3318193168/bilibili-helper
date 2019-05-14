/**
 * Author: DrowsyFlesh
 * Create: 2018/11/11
 * Description:
 */
import React from 'react';
import ReactDOM from 'react-dom';
import {UI} from 'Libs/UI';
import UIBuilder from './videoDownload';

export class VideoDownloadUI extends UI {
    constructor() {
        super({
            name: 'videoDownload',
            dependencies: ['videoAnchor'],
        });
    }

    load = ([container], settings) => {
        if (!settings.on) return Promise.resolve();
        return new Promise(resolve => {
            const VideoDownload = UIBuilder();
            const wrapper = document.createElement('div');
            wrapper.setAttribute('class', 'bilibili-helper-video-download-wrapper');
            wrapper.setAttribute('style', 'order: 0;');

            container.appendChild(wrapper);
            ReactDOM.render(
                <VideoDownload ref={i => this.container = i} setting={settings}/>,
                wrapper,
                () => resolve(this.container),
            );
        });
    };
}
