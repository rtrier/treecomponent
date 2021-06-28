
import { DispatcherWrapper, EventDispatcher } from 'strongly-typed-events';
import { Action } from './Action';
import { Tree } from './Tree';


export enum SelectionMode {
    MULTI,
    SINGLE,
    RADIO,
    // Node with childs where one can be choosen
    RADIO_GROUP
}

// function selectionModeToString(mode:SelectionMode):string {
//     switch (mode) {
//         case SelectionMode.MULTI:
//             return 'multi';
//         case SelectionMode.SINGLE:
//             return 'multi';
//         default:
//             break;
//     }
// }

/**
 * Event fired if the selected node changes
 */
// export interface TreeSelectionChangeEvent extends L.LeafletEvent {
//     /**
//      * changed TreeNode;
//      */
//     changedNode: TreeNode;
// }

export interface NodeRenderer {
    render(object: any): HTMLElement;
}

export interface TreeNodeParam {
    nodeRenderer?: NodeRenderer,
    actions?: Array<Action>,
    // multiselection?:boolean
    hideEmptyNode?: boolean,
    selectMode?: SelectionMode,
    selected?: boolean,
    attName2Render?:string,
    expandOnlyOneNode? : boolean,
    showOnlyChilds?: boolean
}


let nodeCounter = 1;


const standardRender: NodeRenderer = {    
    render: (node: TreeNode) => {
        const div = document.createElement("div");
        if (typeof node.data === 'string') {
            div.innerHTML = node.data;
            div.dataset.tooltip = node.data;
            div.setAttribute("data-tooltip", node.data);
            div.title = node.data;
        }
        else {
            const txt = (node.attName2Render)? node.data[node.attName2Render] : node.data.name;
            if (!txt) {
                debugger
            }
            div.innerHTML = txt;
            div.dataset.tooltip = txt;
            div.setAttribute("data-tooltip", txt);
            div.title = txt;
        }
        div.className = 'tooltip';
        return div
    }
}

export enum SelectionStatus {
    SELECTED,
    UNSELECTED,
    INDETERMINATE
}

export class TreeNode implements TreeNodeParam {

    nodeSelectionChangeHandler: (node: TreeNode, SelectionStatus: SelectionStatus) => void;
    childExpandChangeHandler: (node: TreeNode, expand: boolean) => void;

    onSelectionChange = new EventDispatcher<TreeNode, SelectionStatus>();
    onExpandChange = new EventDispatcher<TreeNode, boolean>();

    data: any;

    parent: TreeNode;

    childs: Array<TreeNode>;

    nodeRenderer: NodeRenderer = standardRender;

    childDom: HTMLDivElement;
    dom: HTMLElement;

    // selected: boolean = false;
    selectionStatus: SelectionStatus = SelectionStatus.UNSELECTED;

    expandOnlyOneNode : boolean;

    showOnlyChilds = false;

    textNode: HTMLSpanElement;

    treerow: HTMLDivElement;

    actions: Array<Action>

    hideEmptyNode = false

    tree: Tree

    selectMode: SelectionMode

    chBox: HTMLInputElement
    spanOpenClose: HTMLSpanElement;

    attName2Render: string;


    static _css_prop = {
        iconWidth : '0.950rem',
        iconDistance: '0.18rem',
        treePadding: '0.3rem'
    }

    css_prop = TreeNode._css_prop;
    insetChilds: number;
    collapsed: boolean = true;

    constructor(data: any, childs?: Array<TreeNode>, params?: TreeNodeParam) {        
        this.data = data;
        this.childs = childs;
        this.nodeSelectionChangeHandler = (node: TreeNode, selectionStatus: SelectionStatus) => this.childSelected(node, selectionStatus);
        if (params) {
            for (let k in params) {
                this[k] = params[k]
            }
            if (params.expandOnlyOneNode) {
                this.childExpandChangeHandler = (node, expanded) => this.childExpandChanged(node, expanded);
            }
        }
        
        if (childs && childs.length > 0) {
            for (let i = 0, count = childs.length; i < count; i++) {
                childs[i].onSelectionChange.subscribe(this.nodeSelectionChangeHandler);
                childs[i].parent = this;
                if (params?.expandOnlyOneNode) {
                    childs[i].onExpandChange.subscribe(this.childExpandChangeHandler);
                }
            }
        }

        if (this.actions) {
            const actions = this.actions
            let f = (evt) => this.actionChanged(evt)
            for (let i = 0; i < actions.length; i++) {
                actions[i].addListener(f)
            }
        }
    }


    actionChanged(evt) {
        this.render();
    }

    getWidh(): number {
        if (this.tree) {
            return this.tree.getWidh()
        }
        return -1
    }

    setTree(tree: Tree) {
        this.tree = tree
        const childs = this.childs
        if (childs && childs.length > 0) {
            for (let i = 0, count = childs.length; i < count; i++) {
                childs[i].setTree(tree);
            }
        }
    }

    setChilds(childs: Array<TreeNode>) {
        this._removeChilds();
        if (childs && childs.length > 0) {
            for (let i = 0, count = childs.length; i < count; i++) {
                childs[i].onSelectionChange.subscribe(this.nodeSelectionChangeHandler);
                // childs[i].on("change", this.childChanged, this);
                // childs[i].on("selected", this.childSelected, this);
                childs[i].parent = this
                if (this.tree) {
                    childs[i].setTree(this.tree)
                }
            }
        }
        this.childs = childs;
        this.render()
    }


    findNode(data: any, prop?: string): Array<TreeNode> {
        // console.info(data+" "+prop, this.data, this.data[prop])
        if ((prop && this.data[prop] === data) || this.data === data) {
            return [this];
        }
        else if (this.childs) {
            for (let i = 0, count = this.childs.length; i < count; i++) {
                const selNodes = this.childs[i].findNode(data, prop)
                if (selNodes) {
                    selNodes.push(this);
                    return selNodes;
                }
            }
        }
    }    

    selectNode(data: any, prop?: string): Array<TreeNode> {
        // console.info(data+" "+prop, this.data, this.data[prop])
        if ((prop && this.data[prop] === data) || this.data === data) {
            console.info("setSSS");
            this.setSelected(true);            
            return [this];
        }
        else if (this.childs) {
            for (let i = 0, count = this.childs.length; i < count; i++) {
                const selNodes = this.childs[i].selectNode(data, prop)
                if (selNodes) {
                    selNodes.push(this);
                    return selNodes;
                }
            }
        }
    }


    unselectNode(data: any, prop: string) {
        if ((prop && this.data[prop] === data) || this.data === data) {
            this.setSelected(false)
            return [this];
        }
        else if (this.childs) {
            for (let i = 0, count = this.childs.length; i < count; i++) {
                const selNodes = this.childs[i].unselectNode(data, prop)
                if (selNodes) {
                    selNodes.push(this);
                    return selNodes;
                }
            }
        }
    }

    addNode(child: TreeNode) {
        // child.on("selected", this.childSelected, this);
        // console.info(`addNode childInset=${this.insetChilds}`, this.data, child.data);
        child.onSelectionChange.subscribe(this.nodeSelectionChangeHandler);
        if (this.onExpandChange) {
            child.onExpandChange.subscribe(this.childExpandChangeHandler);
        }
        if (!this.childs) {
            this.childs = []
        }
        child.parent = this;
        child.setTree(this.tree);
        this.childs.push(child);

        if (this.dom) {
            if (!this.childDom) {
                const nodecontainer = this.childDom = document.createElement('div');
                nodecontainer.className = "nodecontainer"
                this.dom.appendChild(nodecontainer);
                // rtr nodecontainer.style.display = 'none'
            }            
            this.childDom.appendChild(child.render(this.insetChilds));

            const childCount = this.childs ? this.childs.length : 0
            
            // const col = TreeNode.getTreePath(this).length;
            // this.treerow.style.paddingLeft = ((col - 1) * 1.9 + 0.3) + "rem"

            const col = TreeNode.getTreePath(this).length;
            let inset = col;
            if (childCount > 0) {               
                // this.treerow.style.paddingLeft = ((col - 1) * 1.18 + 0.3) + "rem";
                // let s = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                // this.treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                if (this.isCollapsed()) {
                    // this.spanOpenClose.innerText = String.fromCharCode(9660);
                    this.childDom.classList.replace('opened', 'closed');

                    this.spanOpenClose.classList.add('closed');
                    this.spanOpenClose.classList.remove('opened');
                }
                else {
                    // this.spanOpenClose.innerText = String.fromCharCode(9654);                    
                    this.childDom.classList.replace('closed', 'opened');

                    this.spanOpenClose.classList.add('opened');
                    this.spanOpenClose.classList.remove('closed');
                }
                this.treerow.classList.remove('leaf');
            } 
            else {
                // this.treerow.style.paddingLeft = ((col - 2) * 1.18 + 0.3) + "rem";
                // this.treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
            }           
        }
    }    



    remove() {
        this.dom.remove();
    }

    _removeChilds() {
        const childs = this.childs;
        if (childs && childs.length > 0) {
            for (let i = 0, count = childs.length; i < count; i++) {
                childs[i].onSelectionChange.unsubscribe(this.nodeSelectionChangeHandler);
            }
        }
        this.childs = null;
    }

    _removeChild(node: TreeNode) {
        let nodes: Array<TreeNode> = []
        for (let i = 0, count = this.childs.length; i < count; i++) {
            if (this.childs[i] !== node) {
                nodes.push(this.childs[i]);
            }
            else {
                console.info("removeNode " + i, this.childs[i]);
            }
        }
        node.onSelectionChange.unsubscribe(this.nodeSelectionChangeHandler);
        node.remove();
        this.childs = nodes
        this.render();
    }


    isCollapsed(): boolean {
        return this.collapsed;
        // return this.childDom && this.childDom.style.display == 'flex'
    }

    /**
     * expands this node and childs if onlyCurrentNode is not true
     */
    expand(onlyCurrentNode?:boolean) {
        if (this.collapsed) {
            this.collapsed = false;
            if (this.dom) {
                this.dom.classList.replace('closed', 'opened');
                this.spanOpenClose.classList.replace('closed', 'opened');
            }
        }        
        if (!onlyCurrentNode && this.childs) {
            for (let i=0, count=this.childs.length; i<count; i++) {
                this.childs[i].expand();
            }
        } 
    }

    collapse() {
        if (!this.collapsed) {
            this.collapsed = true;
            if (this.dom) {
                this.dom.classList.replace('opened', 'closed');
                this.spanOpenClose.classList.replace('opened', 'closed');
            }
        }
    }
    getSelectMode(): SelectionMode {
        if (this.selectMode !== undefined) {
            return this.selectMode;
        }
        else {
            if (this.parent) {
                return this.parent.getSelectMode();
            }
            else {
                if (this.tree) {
                    return this.tree.selectMode;
                }
            }
        }
        return SelectionMode.SINGLE
    }
/*
    render20210521(inset?:number): HTMLElement {
        // console.info(`render inset=${inset}`, this.data, this.collapsed);
        const col = TreeNode.getTreePath(this).length;
        if (!inset) {
            inset = 0;
        }        
        let insetSelf = 0;
        // let inset = col-1;

        let dom = this.dom;
        let treerow = this.treerow
        if (!dom) {
            dom = this.dom = document.createElement("div");
            dom.className = 'row-wrapper',
            treerow = this.treerow = document.createElement('div');
            treerow.id = "treerow" + nodeCounter            
            treerow.className = "treerow";
            // if (!this.showOnlyChilds) {
            //     dom.appendChild(treerow);
            // }

            const childCount = this.childs ? this.childs.length : 0
            const selectMode = this.getSelectMode();
            const span = document.createElement('div');
            span.className = "treeicon";

            const spanOpenClose = this.spanOpenClose = document.createElement('span');
            spanOpenClose.addEventListener('click', (ev) => this.onTreeIconClick(ev));
            insetSelf++;

            if (this.collapsed) {
                this.dom.classList.add('closed');
            }
            else {                    
                this.dom.classList.add('opened');
            }    

            if (childCount > 0) {
                // treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                if (this.collapsed) {                    
                    this.spanOpenClose.classList.add('closed');
                }
                else {                    
                    this.spanOpenClose.classList.add('opened');
                }                
            }
            else {
                if (selectMode === SelectionMode.SINGLE) {
                    treerow.addEventListener('click', (ev) => this.itemClicked(ev));
                }
                // treerow.style.paddingLeft = (col - 2) * 2.8 + 0.3) + "rem"
                if (selectMode === SelectionMode.RADIO) {
                    // this.treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                    //treerow.style.paddingLeft = ((col-1)*1.18 + 0.3) + "rem"
                } else {
                    // treerow.style.paddingLeft = ((col)*1.18 + 0.3) + "rem";
                    // this.treerow.style.paddingLeft = `calc(${col} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                }
                if (col > 1) {
                    treerow.className = 'treerow leaf'
                }
                // spanOpenClose.innerHTML = "&nbsp;"
            }
            this.textNode = spanOpenClose
            span.appendChild(spanOpenClose);
            if (selectMode === SelectionMode.MULTI) {
                const cb: HTMLInputElement = this._createCeckBox()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label);
                label.addEventListener('click', function () { cb.click() });   
                insetSelf++;             
            } else if (selectMode === SelectionMode.RADIO) {
                const cb: HTMLInputElement = this._createRadioBttn()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label)
                label.addEventListener('click', function () { 
                    cb.click();
                });
                insetSelf++;
            }
            // let inseg = 0;
            for (let i=0; i<inset ; i++) {
                const insetBlock = document.createElement("span");
                insetBlock.className = "inset-block";
                treerow.appendChild(insetBlock);
                // inseg++;
            }
            // console.info(`inseg=${inseg}`)
            treerow.appendChild(span);
            const labelDiv = document.createElement("div")
            labelDiv.className = 'treelabel'
            const label = this.nodeRenderer.render(this)
            if (label) {
                labelDiv.appendChild(label)
                treerow.appendChild(labelDiv);
            }

            if (this.actions) {
                treerow.appendChild(this.renderActions())
            }

            let nodecontainer = this.childDom;
            if (nodecontainer) {
                nodecontainer.innerHTML = null
            }

            if (childCount > 0) {
                if (!nodecontainer) {
                    nodecontainer = this.childDom = document.createElement('div');
                    nodecontainer.className = "nodecontainer"
                    dom.appendChild(nodecontainer);
                    // nodecontainer.style.display = 'none'
                }
                for (let i = 0; i < this.childs.length; i++) {
                    nodecontainer.appendChild(this.childs[i].render(inset+insetSelf));
                }

            }      
            this.dom.style.display = (this.hideEmptyNode && childCount === 0) ? 'none' : 'flex';
        }
        this.insetChilds = inset+insetSelf;
        return dom
    }
*/
    render(inset?:number): HTMLElement {
        console.info(`render inset=${inset}`, this.data, this.collapsed, this.showOnlyChilds);
        const col = TreeNode.getTreePath(this).length;
        if (!inset) {
            inset = 0;
        }        
        let insetSelf = 0;
        // let inset = col-1;

        let dom = this.dom;
        let treerow = this.treerow
        if (!dom) {
            dom = this.dom = document.createElement("div");
            dom.className = 'row-wrapper',
            treerow = this.treerow = document.createElement('div');
            treerow.id = "treerow" + nodeCounter            
            treerow.className = "treerow";
            console.info(`showOnlyChilds=${this.showOnlyChilds}`);

            if (!this.showOnlyChilds) {
                dom.appendChild(treerow);
            }

            const childCount = this.childs ? this.childs.length : 0
            const selectMode = this.getSelectMode();
            const span = document.createElement('div');
            span.className = "treeicon";

            const spanOpenClose = this.spanOpenClose = document.createElement('span');
            spanOpenClose.addEventListener('click', (ev) => this.onTreeIconClick(ev));
            insetSelf++;

            if (this.collapsed) {
                this.dom.classList.add('closed');
            }
            else {                    
                this.dom.classList.add('opened');
            }    

            if (childCount > 0) {
                // treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                if (this.collapsed) {                    
                    this.spanOpenClose.classList.add('closed');
                }
                else {                    
                    this.spanOpenClose.classList.add('opened');
                }                
            }
            else {
                if (selectMode === SelectionMode.SINGLE) {
                    treerow.addEventListener('click', (ev) => this.itemClicked(ev));
                }
                // treerow.style.paddingLeft = (col - 2) * 2.8 + 0.3) + "rem"
                if (selectMode === SelectionMode.RADIO) {
                    // this.treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                    //treerow.style.paddingLeft = ((col-1)*1.18 + 0.3) + "rem"
                } else {
                    // treerow.style.paddingLeft = ((col)*1.18 + 0.3) + "rem";
                    // this.treerow.style.paddingLeft = `calc(${col} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                }
                if (col > 1) {
                    treerow.className = 'treerow leaf'
                }
                // spanOpenClose.innerHTML = "&nbsp;"
            }
            this.textNode = spanOpenClose
            span.appendChild(spanOpenClose);
            if (selectMode === SelectionMode.MULTI) {
                const cb: HTMLInputElement = this._createCeckBox()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label);
                label.addEventListener('click', function () { cb.click() });   
                insetSelf++;             
            } else if (selectMode === SelectionMode.RADIO) {
                const cb: HTMLInputElement = this._createRadioBttn()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label)
                label.addEventListener('click', function () { 
                    cb.click();
                });
                insetSelf++;
            }
            // let inseg = 0;
            for (let i=0; i<inset ; i++) {
                const insetBlock = document.createElement("span");
                insetBlock.className = "inset-block";
                treerow.appendChild(insetBlock);
                // inseg++;
            }
            // console.info(`inseg=${inseg}`)
            treerow.appendChild(span);
            const labelDiv = document.createElement("div")
            labelDiv.className = 'treelabel'
            const label = this.nodeRenderer.render(this)
            if (label) {
                labelDiv.appendChild(label)
                treerow.appendChild(labelDiv);
            }

            if (this.actions) {
                treerow.appendChild(this.renderActions())
            }

            let nodecontainer = this.childDom;
            if (nodecontainer) {
                nodecontainer.innerHTML = null
            }

            if (childCount > 0) {
                if (!nodecontainer) {
                    nodecontainer = this.childDom = document.createElement('div');
                    nodecontainer.className = "nodecontainer"
                    dom.appendChild(nodecontainer);
                    // nodecontainer.style.display = 'none'
                }
                const childInset = this.showOnlyChilds ? inset : (inset + insetSelf);
                console.info(`insets ${inset} - ${inset+insetSelf}`)
                for (let i = 0; i < this.childs.length; i++) {
                    nodecontainer.appendChild(this.childs[i].render(childInset));
                }

            }      
            this.dom.style.display = (this.hideEmptyNode && childCount === 0) ? 'none' : 'flex';
        }
        this.insetChilds = this.showOnlyChilds ? inset : (inset + insetSelf);
        return dom
    }


    renderOrg(inset?:number): HTMLElement {
        // console.info(`render inset=${inset}`, this.data, this.collapsed);
        const col = TreeNode.getTreePath(this).length;
        if (!inset) {
            inset = 0;
        }        
        let insetSelf = 0;
        // let inset = col-1;

        let dom = this.dom;
        let treerow = this.treerow
        if (!dom) {
            dom = this.dom = document.createElement("div");
            dom.className = 'row-wrapper',
            treerow = this.treerow = document.createElement('div');
            treerow.id = "treerow" + nodeCounter            
            treerow.className = "treerow";
            dom.appendChild(treerow);

            const childCount = this.childs ? this.childs.length : 0
            const selectMode = this.getSelectMode();
            const span = document.createElement('div');
            span.className = "treeicon";

            const spanOpenClose = this.spanOpenClose = document.createElement('span');
            spanOpenClose.addEventListener('click', (ev) => this.onTreeIconClick(ev));
            insetSelf++;

            if (this.collapsed) {
                this.dom.classList.add('closed');
            }
            else {                    
                this.dom.classList.add('opened');
            }    

            if (childCount > 0) {
                // treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                if (this.collapsed) {                    
                    this.spanOpenClose.classList.add('closed');
                }
                else {                    
                    this.spanOpenClose.classList.add('opened');
                }                
            }
            else {
                if (selectMode === SelectionMode.SINGLE) {
                    treerow.addEventListener('click', (ev) => this.itemClicked(ev));
                }
                // treerow.style.paddingLeft = (col - 2) * 2.8 + 0.3) + "rem"
                if (selectMode === SelectionMode.RADIO) {
                    // this.treerow.style.paddingLeft = `calc(${col - 1} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                    //treerow.style.paddingLeft = ((col-1)*1.18 + 0.3) + "rem"
                } else {
                    // treerow.style.paddingLeft = ((col)*1.18 + 0.3) + "rem";
                    // this.treerow.style.paddingLeft = `calc(${col} * (${this.css_prop.iconWidth} + ${this.css_prop.iconDistance}) + ${this.css_prop.treePadding})`;
                }
                if (col > 1) {
                    treerow.className = 'treerow leaf'
                }
                // spanOpenClose.innerHTML = "&nbsp;"
            }
            this.textNode = spanOpenClose
            span.appendChild(spanOpenClose);
            if (selectMode === SelectionMode.MULTI) {
                const cb: HTMLInputElement = this._createCeckBox()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label);
                label.addEventListener('click', function () { cb.click() });   
                insetSelf++;             
            } else if (selectMode === SelectionMode.RADIO) {
                const cb: HTMLInputElement = this._createRadioBttn()
                span.appendChild(cb);
                const label = document.createElement("label");
                span.appendChild(label)
                label.addEventListener('click', function () { 
                    cb.click();
                });
                insetSelf++;
                
            }

            for (let i=0; i<inset; i++) {
                const insetBlock = document.createElement("span");
                insetBlock.className = "inset-block";
                treerow.appendChild(insetBlock);
            }
            treerow.appendChild(span);
            const labelDiv = document.createElement("div")
            labelDiv.className = 'treelabel'
            const label = this.nodeRenderer.render(this)
            if (label) {
                labelDiv.appendChild(label)
                treerow.appendChild(labelDiv);
            }

            if (this.actions) {
                treerow.appendChild(this.renderActions())
            }

            let nodecontainer = this.childDom;
            if (nodecontainer) {
                nodecontainer.innerHTML = null
            }

            if (childCount > 0) {
                if (!nodecontainer) {
                    nodecontainer = this.childDom = document.createElement('div');
                    nodecontainer.className = "nodecontainer"
                    dom.appendChild(nodecontainer);
                    // nodecontainer.style.display = 'none'
                }
                for (let i = 0; i < this.childs.length; i++) {
                    nodecontainer.appendChild(this.childs[i].renderOrg(inset+insetSelf));
                }

            }      
            this.dom.style.display = (this.hideEmptyNode && childCount === 0) ? 'none' : 'flex';
        }
        this.insetChilds = inset+insetSelf;
        return dom
    }

    renderActions(): HTMLElement {
        let actDiv = document.createElement("div")
        actDiv.className = "tree_action_icons"
        for (let i = 0; i < this.actions.length; i++) {
            const a = this.actions[i]
            if (a.authorized) {
                actDiv.appendChild(this.renderIcon(a.icon, () => a.callback(this.data)))
            }
        }
        return actDiv
    }

    renderIcon(icon: string, cb: (evt) => void): HTMLElement {
        const el = document.createElement("i")
        el.style.cssFloat = "right"
        el.style.marginLeft = "12px"
        el.className = "fas fa-" + icon
        el.onclick = cb
        return el;
    }

    /**
     * return the checkbox for item selection, if not exist create 
     */
    _createCeckBox(): HTMLInputElement {
        let chBox: HTMLInputElement;
        if (!this.chBox) {
            chBox = this.chBox = document.createElement('input');
            chBox.type = 'checkbox';
            chBox.id = 'lsw_cb' + this.data.id;
            chBox.className = 'regular-checkbox';
            chBox.setAttribute('aria-label', this.data.id);
            chBox.checked = this.selectionStatus === SelectionStatus.SELECTED || this.selectionStatus === SelectionStatus.INDETERMINATE;
            chBox.indeterminate = this.selectionStatus === SelectionStatus.INDETERMINATE;
            chBox.addEventListener('change', (ev) => this.onchBoxChange(ev));
        }
        return this.chBox
    }

    _createRadioBttn(): HTMLInputElement {
        if (!this.chBox) {
            const chBox = this.chBox = document.createElement('input');
            chBox.type = 'radio';
            chBox.id = 'lsw_cb' + this.data.id;
            chBox.className = 'regular-checkbox';
            chBox.setAttribute('aria-label', this.data.id);
            chBox.checked = this.selectionStatus===SelectionStatus.SELECTED;
            chBox.addEventListener('change', (ev) => this.onchBoxChange(ev));            
            this.chBox = chBox;
        }
        return this.chBox
    }

    onchBoxChange(evt: any) {
        // console.warn(`onchBoxChange ${this.data.name} ${this.chBox.checked} childCount=${this.childs ? this.childs.length : 0}`);
        // console.warn(this);
        if (this.childs) {
            const isSelected = this.chBox.checked;
            for (let i = 0; i < this.childs.length; i++) {
                this.childs[i].setSelected(isSelected);
            }
        }
        else {
            this.setSelected(this.chBox.checked)
        }
        evt.preventDefault();
    }



    itemClicked(evt: MouseEvent): void {        
        this.setSelected(this.selectionStatus===SelectionStatus.UNSELECTED);
    }

    onTreeIconClick(evt: MouseEvent) {
        // console.info(`onTreeIconClick ${this.collapsed}`);
        if (this.childs && this.childs.length > 0) {
            if (this.collapsed) {
                this.dom.classList.replace('closed', 'opened');
                // this.childDom.classList.replace('closed', 'opened');
                this.spanOpenClose.classList.replace('closed', 'opened');
            }
            else {
                this.dom.classList.replace('opened', 'closed');
                // this.childDom.classList.replace('opened', 'closed');
                this.spanOpenClose.classList.replace('opened', 'closed');
            }
            this.collapsed=!this.collapsed;
            this.onExpandChange.dispatch(this, !this.collapsed);
        }
        evt.stopImmediatePropagation();
    }

    // isSelected(): boolean {
    //     if (this.chBox) {
    //         return this.chBox.checked;
    //     }
    //     return this.selected;
    // }

    getSelectionsStatus():SelectionStatus {
        // if (this.chBox) {
        //     if (this.chBox.checked) {
        //         return this.chBox.indeterminate ? SelectionStatus.INDETERMINATE : SelectionStatus.SELECTED;
        //     }
        //     return SelectionStatus.UNSELECTED;
        // }
        // return this.selected ? SelectionStatus.SELECTED : SelectionStatus.UNSELECTED;
        return this.selectionStatus;
    }

    /*
    childSelected(evt:TreeSelectionChangeEvent) {
        this.fire(Tree.NODE_SELECTION_CHANGE_EVENT, {changedNode:evt.changedNode});
    }
    */

    _getStatusOfChilds():SelectionStatus {
        let count = 0;
        for (let i = 0; i < this.childs.length; i++) {
            // console.info(`\t ${i} ${SelectionStatus[this.childs[i].getSelectionsStatus()]}`);
            const sStatus = this.childs[i].getSelectionsStatus();
            if (sStatus===SelectionStatus.SELECTED) {
                 count++;
            } else {
                if (sStatus===SelectionStatus.INDETERMINATE) {
                    return SelectionStatus.INDETERMINATE;
                }
            }
        }
        if (count === 0) return SelectionStatus.UNSELECTED;
        return (this.childs.length > count) ? SelectionStatus.INDETERMINATE : SelectionStatus.SELECTED;
    }

    childExpandChanged(node: TreeNode, expanded: boolean): void {
        console.info("childExpandChanged");
        if (expanded && this.expandOnlyOneNode) {
            const count = this.childs ? this.childs.length : 0;
            for (let i=0; i<count; i++) {
                if (node !== this.childs[i]) {
                    this.childs[i].collapse();
                }
            }
        }
    }


    childSelected(n: TreeNode, selectionStatus: SelectionStatus) {
        // console.info(`childSelected this=${this.data.bezeichnung} child=${n.data.bezeichnung} ${SelectionStatus[selectionStatus]}`);
        const selStatus = this._getStatusOfChilds();
        if (this.chBox) {           
            if (selStatus === SelectionStatus.UNSELECTED) {
                this.chBox.checked = false;
                this.chBox.indeterminate = false;
            }
            else {
                this.chBox.checked = true;
                this.chBox.indeterminate = selStatus === SelectionStatus.INDETERMINATE;
            }
        }
        // console.info(`childSelected this=${this.data.bezeichnung} child=${n.data.bezeichnung} ${SelectionStatus[selectionStatus]} 
        // => ${selStatus}`);
        this.selectionStatus = selStatus;
        this.onSelectionChange.dispatch(this, selStatus);   
        
        
    }


    getSelected(): Array<any> {
        let ids: Array<any> = [];
        if (this.selectionStatus===SelectionStatus.SELECTED || this.selectionStatus===SelectionStatus.INDETERMINATE) {
            if (this.selectionStatus===SelectionStatus.SELECTED) {
                ids.push(this.data);
            }
            if (this.childs) {
                for (let i = 0; i < this.childs.length; i++) {
                    ids = ids.concat(this.childs[i].getSelected());
                }
            }
        }
        return ids;
    }


    setSelected(selected: boolean) {
        // console.info(`setSelected ${this.data.name? this.data.name : this.data} SelectionMode=${SelectionMode[this.getSelectMode()]}`);

        const selectionsStatus = selected ? SelectionStatus.SELECTED : SelectionStatus.UNSELECTED;
        if (selectionsStatus === this.selectionStatus) {
            return;
        }
        if (this.getSelectMode() === SelectionMode.SINGLE) {
            if (this.treerow) {
                if (this.selectionStatus===SelectionStatus.UNSELECTED) {
                    this.treerow.classList.add('selected');
                } else {                    
                    this.treerow.classList.remove('selected');
                }
            }
        }
        else {
            if (this.chBox) {
                this.chBox.checked = selected;
            }
            if (this.childs) {
                for (let i = 0; i < this.childs.length; i++) {
                    this.childs[i].setSelected(selected);
                }
            }            
        }
        this.selectionStatus = selected ? SelectionStatus.SELECTED : SelectionStatus.UNSELECTED;
        this.onSelectionChange.dispatch(this, this.selectionStatus);
    }

    // _setSelected(selected: boolean) {
    //     console.error(`_setSelected ${this.data.name} this.selected=${this.selected} => ${selected}`);
    //     if (selected === this.selected) {
    //         return;
    //     }
    //     if (this.treerow) {
    //         if (this.selected) {
    //             this.treerow.classList.remove('selected');
    //         }
    //         else {
    //             this.treerow.classList.add('selected');
    //         }
    //     }
    //     this.selected = !this.selected;
    // }

    resize() {
        const treeWidth = this.tree.getWidh();
        // return;
        // console.info(this.data.name + "  !!!!!!!!!");
        // console.info("tree", this.tree.getBoundingClientRect())        
        const childs = this.childs
        if (childs && childs.length > 0) {
            for (let i = 0, count = childs.length; i < count; i++) {
                childs[i].resize();
            }
        }
        else {
            let treeRow = this.treerow
            let recRow = treeRow.getBoundingClientRect()
            // console.log("treeRow", recRow);
            let wA: Array<number> = []
            for (let i = 0; i < treeRow.childNodes.length; i++) {
                let child: HTMLElement = <HTMLElement>treeRow.children[i]

                let recChild = child.getBoundingClientRect()
                // console.log("elem" + i + "  ", recChild);
                wA.push(recChild.width);
            }
            // console.log("span"+1+"  ", recRow, recSpa);
            const child: HTMLElement = <HTMLElement>treeRow.children[1]
            // child.style.width = (treeWidth - 130) + "px"
            // let w:number = ( treeWidth - wA[0] - wA[2] - 92 )
            const w: number = (treeWidth + recRow.left - child.getBoundingClientRect().left - wA[2])
            // console.log("res   "+ w + " = " + treeWidth +" - "+ wA[0]+" - "+ wA[2]);
            // console.log("res   "+ w + " = " + treeWidth +" + "+ recRow.left+ " - "+ child.getBoundingClientRect().left + " - " + wA[2]);
            child.style.width = w + "px"
        }
    }



    static getTreePath(node: TreeNode): Array<TreeNode> {
        const result = [node];
        let parent = node.parent;
        while (parent) {
            result.push(parent)
            parent = parent.parent
        }
        return result.reverse();
    }

}



export class RadioGroupTreeNode extends TreeNode {

    constructor(data: any, childs: Array<TreeNode>, params?: TreeNodeParam) {
        super(data, childs, params)
        this.selectMode = SelectionMode.RADIO_GROUP
        for (let i = 0, count = childs.length; i < count; i++) {
            childs[i].selectMode = SelectionMode.RADIO
        }
    }

    // childSelected(n: TreeNode, selectionStatus: SelectionStatus) {
    //     console.info(`radioTreeNode.childSelected this=${this.data.bezeichnung} child=${n.data.bezeichnung} ${SelectionStatus[selectionStatus]}`);     
    //     this.onSelectionChange.dispatch(n, selectionStatus);        
    // }

    childSelected(node: TreeNode, status: SelectionStatus) {
        // console.error(`RadioGroupTreeNode.childSelected ${node.data.name} ${SelectionStatus[status]}`);        
        // console.info(`radioTreeNode.childSelected this=${this.data.bezeichnung} child=${node.data.bezeichnung} ${SelectionStatus[status]}`);     
        if (node.getSelectionsStatus()===SelectionStatus.SELECTED) {
            for (let i = 0, count = this.childs.length; i < count; i++) {
                if (this.childs[i] !== node) {
                    this.childs[i].setSelected(false)
                }
            }
            // console.info(`RadioGroupTreeNode.childSelected dispatch ${node.data.name}`);
            this.onSelectionChange.dispatch(node, SelectionStatus.SELECTED);
        }
    }
}



