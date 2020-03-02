/**
 * Author: Ruo
 * Create: 2018-07-28
 * Description: 列表项目
 */

import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled, {ThemeProvider} from 'styled-components';
import {Button} from 'Components';

/**
 * props: twoLine
 */
const ListItemView = styled.div.attrs({
    className: 'list-item',
})`
  //margin-top: 3px;
  background-color: #fff;
  border-top: ${props => props.noBorder ? 'none' : '1px solid #f2f3f5'};
  &:nth-of-type(1) {
    border-top: none;
    margin-top: 0;
  }
  .sub-list &:nth-of-type(1) {
    border-top: ${props => props.noBorder ? 'none' : '1px solid #f2f3f5'};
  }
`;

const TitleView = styled.div.attrs({
    className: 'title-view',
})`
  min-height: ${props => props.theme.twoLine ? '65px' : '49px'};
  padding: 0 0 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  cursor: ${({onClick}) => onClick ? 'pointer' : 'default'};
  opacity: ${({theme = {toggle: true}}) => theme.toggle ? 1 : 0.5};
  //.icon {
  //  margin: 0 12px 0 -6px;
  //}
`;

const TwoLineContainerView = styled.div.attrs({
    className: 'two-line-container',
})`
  display: flex;
  flex-direction: column;
  flex: auto;
  h3 {
    margin: 0;
    height: 20px;
    font-size: 13px;
  }
`;
const First = styled.h3`
  margin: 0;
  height: 20px;
  font-size: 13px;
  font-weight: 400;
`;
const Secondary = styled.div`
  margin-top: 2px;
  height:20px;
  font-size: 12px;
  font-weight: 400;
  color: #757575;
`;

const Start = styled.div.attrs({
    className: 'list-item-start',
})`
  .icon + & {
    -webkit-padding-start: 16px;
  }
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: auto;
  margin: 15px 0;
  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
    height: 20px;
    font-size: 13px;
  }
`;
/*
const Middle = styled.div.attrs({
    className: 'list-item-middle',
})`
  display: flex;
  align-items: center;
  .separator + & {
    //margin: -12px;
  }
`;
*/

const End = styled.div.attrs({
    className: 'list-item-end',
})`
  display: flex;
  align-items: center;
  margin: 0 20px 0 0;
  .separator + & {
    margin: 0 13px 0 -13px;
  }
`;

const SubList = styled.div.attrs({
    className: props => props.hide ? 'sub-list hide' : 'sub-list',
})`
  display: flex;
  flex-direction: column;
  position: relative;
  max-height: 0;
  border-radius: 4px;
  background-color: white;
  transition: all 0.3s;
  overflow: hidden;
  opacity: 1;
  .list-item {
    margin-left: 60px;
    .list-item-start {
      margin: 0;
    }
    &:last-of-type {
      padding-bottom: 16px;
    }
  }
`;

/**
 * 分割线
 * 根据twoLine属性设定自适应高度
 */
const Separator = styled.div.attrs({
    className: 'separator',
})`
  height: calc(${props => props.theme.twoLine ? '65px' : '49px'} - 2 * 9px);
  -webkit-border-start: 1px solid rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
  -webkit-margin-end:20px;
  -webkit-margin-start:20px;
`;

export class ListItem extends React.Component {
    propTypes = {
        subList: PropTypes.object,
        operation: PropTypes.any,
        children: PropTypes.any,
        icon: PropTypes.any,
        separator: PropTypes.bool,
        twoLine: PropTypes.bool,
        noBorder: PropTypes.bool,
        extend: PropTypes.bool,
        toggle: PropTypes.bool,
        first: PropTypes.any,
        second: PropTypes.any,
        middle: PropTypes.any,
        onClick: PropTypes.func,
    };

    constructor(props) {
        super();
        const {subList} = props;
        this.state = {
            maxHeight: 0,
            hideSubList: subList && subList.hide !== undefined ? subList.hide : false,
        };
    }

    componentDidMount() {
        if (this.subListRef) {
            const sumHeight = _.sumBy(this.subListRef.querySelectorAll('.list-item, *'),
                (e) => e.getBoundingClientRect().height);
            this.setState({maxHeight: sumHeight});
        }
    }

    render() {
        let {
            operation = null, // 右侧操作DOM，可能是按钮，单选按钮或者面板折叠按钮
            icon, // 显示在最左侧的ICON
            children,
            separator = false, // 右侧操作DOM是否要添加分割线
            twoLine = false, // 是否两行高度
            first, // 标题，需要twoLine = true
            second, // 副标题，需要twoLine = true
            middle = null, // 中间内容
            subList = null,
            noBorder = false,
            extend = false, // subList是否为可折叠，如果没有设定operation就会自动将operation设定为折叠按钮
            onClick,
            toggle = true, // 是否可以切换，即operation是否可点击
            ...rest
        } = this.props;
        const {maxHeight, hideSubList} = this.state;
        if (!operation && subList && subList.children && extend) {
            operation = <Button
                icon={hideSubList === true ? 'arrowDown' : 'arrowUp'}
                onClick={() => this.setState({hideSubList: !hideSubList})}
            />;
            onClick = () => this.setState({hideSubList: !hideSubList});
        }
        return (
            <ThemeProvider theme={{twoLine, toggle}}>
                <ListItemView noBorder={noBorder} {...rest}>
                    <TitleView onClick={toggle ? onClick : extend ? onClick : null}>
                        {icon && icon}
                        {twoLine && <TwoLineContainerView>
                            {first && <First>{first}</First>}
                            {second && <Secondary>{second}</Secondary>}
                        </TwoLineContainerView>}
                        {!twoLine && <Start>{children}{middle}</Start>}
                        {separator && <Separator/>}
                        {operation && <End>{operation}</End>}
                    </TitleView>
                    {/* 折叠子列表 */}
                    {subList && subList.children && <ThemeProvider theme={{twoLine, ...subList.theme}}>
                        <SubList
                            style={{
                                maxHeight: (!extend && subList.hide) || (extend && hideSubList === true) ? '0' : maxHeight || '',
                                transitionDuration: `${Math.min(Math.sqrt(subList.children.length) / 10 + (hideSubList ? 0.1 : 0.5), 1.2)}s`,
                            }}
                            ref={i => this.subListRef = i}
                        >{subList.children}</SubList>
                    </ThemeProvider>}
                </ListItemView>
            </ThemeProvider>
        );
    }
}
