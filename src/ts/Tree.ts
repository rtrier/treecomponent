import { EventDispatcher } from "strongly-typed-events";
import { SelectionMode, SelectionStatus, TreeNode } from "./TreeNode";


export interface TreeParam {
    selectMode?:SelectionMode,
    expandOnlyOneNode? : boolean
}

export interface ChangeNodeOrderEvent {
    node:TreeNode;
    up: boolean;
}

export class Tree {

    static NODE_SELECTION_CHANGE_EVENT = "nodeSelectionChange";
    static NODE_SELECTED_EVENT = "node_selected";
    static NODE_UNSELECTED_EVENT = "node_unselected";

    selectMode:SelectionMode = SelectionMode.SINGLE;
    expandOnlyOneNode:boolean;

    nodeSelectionChangeHandler:(node:TreeNode, SelectionStatus:SelectionStatus)=>void;
    childExpandChangeHandler: (node: TreeNode, expand: boolean) => void;

    onSelectionChange = new EventDispatcher<TreeNode, SelectionStatus>();

    pane: HTMLDivElement = null;

    nodes: Array<TreeNode> = [];

    selectedNode: TreeNode;

    observer: MutationObserver;

    constructor(nodes: Array<TreeNode>, param?:TreeParam) {

        if (param) {
            for (let k in param) {
                this[k] = param[k]
            }
            if (param.expandOnlyOneNode) {
                this.childExpandChangeHandler = (node, expanded) => this.childExpandChanged(node, expanded);
            }
        }
        this.nodeSelectionChangeHandler = (node, status) => this.nodeSelected(node, status);
        if (nodes) {
            this.nodes = nodes;
            for (let i = 0, count = nodes.length; i < count; i++) {
                nodes[i].setTree(this)
                nodes[i].onSelectionChange.subscribe(this.nodeSelectionChangeHandler);
                if (this.expandOnlyOneNode) {
                    nodes[i].onExpandChange.subscribe( this.childExpandChangeHandler );
                }
            }
        }
        else {
            this.nodes = [];
        }
    }

    _render(): HTMLDivElement {
        const pane = document.createElement("div");
        pane.className = "treecontainer"
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            pane.appendChild(this.nodes[i].render());
        }
        return this.pane = pane;
    }


    _mutation(mutations: MutationRecord[], observer: MutationObserver) {    
        this.resize()
        let f = () => this.resize()
        window.setTimeout(f, 520)       
    }


    _update(): HTMLDivElement {
        const pane = this.pane;
        const newChilds = [];
        
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            newChilds.push(this.nodes[i].render());
        }
        pane.replaceChildren(...newChilds);
        console.info("replacc")
        return this.pane = pane;
    }

    moveNodeUp(n:TreeNode) {
        console.info('moveNodeUp')
        const idx = this.nodes.indexOf(n);
        if (idx>0) {
            const otherNode = this.nodes[idx-1];
            this.nodes[idx-1] = n;
            this.nodes[idx] = otherNode;
        }
        this._update();
    }
    moveNodeDown(n:TreeNode) {
        console.info('moveNodeDown')
        const idx = this.nodes.indexOf(n);
        if (idx<this.nodes.length-1) {
            const otherNode = this.nodes[idx+1];
            this.nodes[idx+1] = n;
            this.nodes[idx] = otherNode;
        }
        this._update();
    }

    resize() {
        // console.info("Tree "+ this.nodes.length, this.pane.getBoundingClientRect());        
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            this.nodes[i].resize();
        }
    }

    addNode(node: TreeNode) {
        // console.info("addNode", node);
        node.setTree(this)
        node.onSelectionChange.subscribe( this.nodeSelectionChangeHandler );
        if (this.expandOnlyOneNode) {
            node.onExpandChange.subscribe( this.childExpandChangeHandler );
        }
        this.nodes.push(node)        
        if (this.pane) {
            let el = node.render()
            this.pane.appendChild(el);
        }
    }

    addNodes(nodes: TreeNode[]) {
        // console.info("addNode", node);
        const newNodes:TreeNode[] = [];
        const d = document.createDocumentFragment();
        for (let i=0; i<nodes.length; i++) {
            const node = nodes[i]
            node.setTree(this)
            node.onSelectionChange.subscribe( this.nodeSelectionChangeHandler );
            if (this.expandOnlyOneNode) {
                node.onExpandChange.subscribe( this.childExpandChangeHandler );
            }
            this.nodes.push(node)    
            newNodes.push(node);
            d.appendChild(node.render());
        }
        if (this.pane) {

            // let el = node.render()
            this.pane.appendChild(d);
        }
    }    

    insertNode(node: TreeNode, pos:number) {
        node.setTree(this)
        node.onSelectionChange.subscribe( this.nodeSelectionChangeHandler );
        if (this.expandOnlyOneNode) {
            node.onExpandChange.subscribe( this.childExpandChangeHandler );
        }
        let nodes:Array<TreeNode> = [];
        for (let i=0, count=this.nodes.length; i<count; i++) {
            if (i===pos) {
                nodes.push(node);
            }
            nodes.push(this.nodes[i]);
        }   
        if (pos<this.nodes.length) {
            this.pane.insertBefore(node.render(), this.nodes[pos].dom)
        }
        else {
            this.pane.appendChild(node.render())
        }
        this.nodes = nodes
    }

    findNode(data:any, node?:TreeNode):TreeNode {
        let nodes:Array<TreeNode> = node? node.childs : this.nodes;
        if (nodes) {
            for (let i=0, count=nodes.length; i<count; i++) {
                if (data === nodes[i].data) {
                    return nodes[i]
                }
                else {
                    let node = this.findNode(data, nodes[i])
                    if (node) {
                        return node;
                    }
                }
            }
        }
        return null
    }

    selectNode(data:any, prop?:string):Array<TreeNode> {
        for (let i=0, count=this.nodes.length; i<count; i++) {
            let selNodes = this.nodes[i].selectNode(data, prop);            
            if (selNodes) {
               return selNodes;
            }
        }
    }
    unselectNode(data:any, prop?:string) {
        for (let i=0, count=this.nodes.length; i<count; i++) {
            let selNodes = this.nodes[i].unselectNode(data, prop);            
        }
    }

    selectAndExpandNode(data:any, prop?:string):Array<TreeNode> {
        for (let i=0, count=this.nodes.length; i<count; i++) {
            let selNodes = this.nodes[i].selectNode(data, prop)
            // console.info('selectNode', selNodes);
            if (selNodes) {
                return selNodes;
            }
        }
    }

    expandAll():void {
        for (let i=0, count=this.nodes.length; i<count; i++) {
            this.nodes[i].expand();
        }
    }

    removeNode(node: TreeNode) {
        // console.info("removeNode", node);
        node.setTree(null)
        node.onSelectionChange.unsubscribe(this.nodeSelectionChangeHandler);
        if (this.expandOnlyOneNode) {
            node.onExpandChange.unsubscribe( this.childExpandChangeHandler );
        }
        // node.off("change", this.selectionChanged, this);
       
        if (node.parent) {
            node.parent._removeChild(node)
        }
        else {
            let nodes:Array<TreeNode> = []   
            for (let i=0, count=this.nodes.length; i<count; i++) {
                if (this.nodes[i]!==node) {
                    nodes.push(this.nodes[i]);
                }
                else {
                    console.info("removeNode "+i, this.nodes[i]);
                }
            }
            node.remove();
            this.nodes = nodes
        }
        
        
    }

    onResize(ev: UIEvent): any {
        this.resize()
    }


    addTo(elem: HTMLElement) {
        if (!this.pane) {
            this._render()
            window.addEventListener("resize", (ev:UIEvent) => this.onResize(ev))
        }
        let pane = this.getDom();
        pane.addEventListener("resize", (ev:UIEvent) => this.onResize(ev))
        elem.addEventListener("resize", (ev:UIEvent) => this.onResize(ev))
        elem.appendChild(this.getDom())
    }

    getWidh(): number {
        return (this.pane && this.pane.parentElement) ? this.pane.parentElement.clientWidth : -1        
    }

    getBoundingClientRect() {
        return (this.pane && this.pane.parentElement) ? this.pane.getBoundingClientRect()  : null
    }

    getDom(): HTMLDivElement {
        return this.pane;
    }

    /**
     * return the Data of the selected nodes
     */
    getSelected(): Array<any> {
        let result = [];
        for (let i = 0, count = this.nodes.length; i < count; i++) {
            result = result.concat(this.nodes[i].getSelected());
        }
        return result;
    }


    childExpandChanged(node: TreeNode, expanded: boolean): void {
        console.info("childExpandChanged");
        if (expanded && this.expandOnlyOneNode) {
            const count = this.nodes ? this.nodes.length : 0;
            for (let i=0; i<count; i++) {
                if (node !== this.nodes[i]) {
                    this.nodes[i].collapse();
                }
            }
        }
    }


    // nodeSelected(evt:L.LeafletEvent) {
    nodeSelected(node:TreeNode, status:SelectionStatus) {
        // console.info(`Tree nodeSelected(${node.data.name} status=${SelectionStatus[status]}) selectedNode=${this.selectedNode ? this.selectedNode.data.name : "undefined"}`);
        if (this.selectMode===SelectionMode.SINGLE) {
            if (this.selectedNode) {
                // console.info(`oldSelectedNode=${this.selectedNode.data.name}  `+this.selectedNode.data.name);
                if (this.selectedNode!==node) {
                    this.selectedNode.setSelected(false);
                }
            }
            if (node && node.selectionStatus===SelectionStatus.SELECTED) {
                this.selectedNode = node;
                // console.info("dispatch02");
                this.onSelectionChange.dispatch(this.selectedNode, status); 
            } 
            else {
                // console.info("dispatch03");
                this.onSelectionChange.dispatch(node, status); 
            }
        }
        else {
            this.onSelectionChange.dispatch(node, status);
        }
    }

}