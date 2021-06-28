require('./css/tree.scss');

import { Tree, TreeParam } from './ts/Tree';
import { TreeNode, TreeNodeParam, SelectionMode, SelectionStatus, RadioGroupTreeNode } from './ts/TreeNode';

document.addEventListener("DOMContentLoaded", start);

function nodeChanged(node:TreeNode, sel:SelectionStatus) {
    console.info(`nodeChanged ${node.data.name}, ${SelectionStatus[sel]}`);
}

function baseLayerSelected(node:TreeNode, sel:SelectionStatus) {
    console.info(`baseLayerSelected ${node.data.name}, ${SelectionStatus[sel]}`);
}


function createHtmlElement<K extends keyof HTMLElementTagNameMap>(tag:K, parent?:HTMLElement, className?:string): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (parent) {
        parent.appendChild(el);
    }
    if (className) {
        el.className = className;
    }
    return el;
}
class TreeElementOptions  {
    
    title:string;
    items:TreeElement[] = [];

    constructor(name:string) {
        this.title = name;
    }

    isLeaf() {
        return this.items.length === 0;
    }

}

class TreeElement {
    name:any;
    opts:TreeElementOptions;

    constructor(name:string) {
        this.name = name;
        this.opts = new TreeElementOptions(name) ;
    }
}

class Configuration  {
    items:TreeElement[] = [];
}

function getConfGeoport() {

    const configuration = new Configuration();
    for (let i=0; i<1; i++) {
        const n = new TreeElement(`node-${i}`);
        configuration.items.push(n);
        for (let k=0; k<1; k++) {
            n.opts.items.push(new TreeElement(`node-${i}.${k}`));
            
            // for (let j=0; j<4; j++) {
            //     const jNode = new TreeNode({name:`sehr-langer-node-${i}.${k}.${j}`}, undefined, treeNodeParam);
            //     kNode.addNode(jNode);
            //     if (j===2) {
            //         for (let m=0; m<4; m++) {
            //             const mNode = new TreeNode({name:`mnode-${i}.${k}.${j}.${m}`}, undefined, treeNodeParam);
            //             jNode.addNode(mNode);
            //         }
            //     }
            // }
        }
    }
    return configuration;


}

function createOtherTree(conf:Configuration):HTMLElement {
    const dom = createHtmlElement('div', undefined, "mb-element mb-element-basesourceswitcher");
    dom.id = "testId"; 
    dom.title = "testTitle";

    // <div id="{{ id }}" class="mb-element mb-element-basesourceswitcher"  title="{{ configuration.tooltip|default(title)|trans }}">

    conf.items.forEach(group => {
        if (group.opts.isLeaf()) {
            // <div class="basesourcesetswitch" data-sourceset="{{ opts.sources | join(',') }}" >
            // <span class="state-check iconRadio"></span>{{ opts.title | trans }}</div>
            const leaf = createHtmlElement('div', dom, "basesourcesetswitch");
            createHtmlElement('span', leaf, "state-check iconRadio");
            createHtmlElement('span', leaf).innerHTML = group.opts.title;
        } else {
            const el = createHtmlElement('div', dom, "basesourcegroup");
            createHtmlElement('div', el, "desktop-only group-title").innerHTML = group.opts.title;
            const container = createHtmlElement('div', el, "basesourcesubswitcher");
            group.opts.items.forEach(item =>{
                // <div class="basesourcesetswitch" data-sourceset="{{ opt.sources | join(',') }}" >
                // <span class="state-check iconRadio"></span>{{ opt.title | trans }}</div>
                const leaf = createHtmlElement('div', container, "basesourcesetswitch");
                createHtmlElement('span', leaf, "state-check iconRadio");
                createHtmlElement('span', leaf).innerHTML = group.opts.title;
            });
        }
    });
    return dom;
}
    



function createTree(treeParam:TreeParam) {



    const tree = new Tree(null, treeParam);

    tree.onSelectionChange.subscribe(nodeChanged);




    
    const treeNodeParam:TreeNodeParam = {
        // "actions":undefined,
        "hideEmptyNode": false,
        // "nodeRenderer": undefined,
        "selectMode": SelectionMode.MULTI,
        "selected": false
    }
    const treeNodeSingleSelectionParam:TreeNodeParam = {
        // "actions":undefined,
        "hideEmptyNode": false,
        // "nodeRenderer": undefined,
        "selectMode": SelectionMode.SINGLE,
        "selected": false
    }    

    const rgNodes:TreeNode[] = [];
    for (let i=0, count=3; i<count; i++) {
        rgNodes.push(new TreeNode({name:`radioGroupIten${i}`}, null));
    }
    const node = new RadioGroupTreeNode({name:'Grundkarte'}, rgNodes, null);
    node.onSelectionChange.subscribe((n, status)=>baseLayerSelected(n, status));
    tree.addNode(node);

    for (let i=0; i<1; i++) {
        const n = new TreeNode({name:`node-${i}`}, undefined, treeNodeSingleSelectionParam);
        tree.addNode(n);
        for (let k=0; k<1; k++) {
            const kNode = new TreeNode({name:`node-${i}.${k}`}, undefined, treeNodeParam);
            n.addNode(kNode);
            for (let j=0; j<4; j++) {
                const jNode = new TreeNode({name:`sehr-langer-node-${i}.${k}.${j}`}, undefined, treeNodeParam);
                kNode.addNode(jNode);
                if (j===2) {
                    for (let m=0; m<4; m++) {
                        const mNode = new TreeNode({name:`mnode-${i}.${k}.${j}.${m}`}, undefined, treeNodeParam);
                        jNode.addNode(mNode);
                    }
                }
            }
        }
    }
    tree.selectNode('sehr-langer-node-0.0.1', 'name');

    return tree;
}

function start() {
    console.info("TEST");


    const tree = createTree({
        "selectMode":SelectionMode.MULTI
    });

    

    const bttn01 = document.createElement('button');
    bttn01.textContent = 'selectNode';
    bttn01.addEventListener('click', (ev) => {
        console.info("selectNode", tree);
        tree.selectNode('node-0.0', 'name');
    });
    const bttn02 = document.createElement('button');
    bttn02.textContent = 'unselectNode';
    bttn02.addEventListener('click', (ev) => {
        console.info("unselectNode", tree);
        tree.unselectNode('node-0.0', 'name');
    });
    tree.expandAll();

    const tree2 = createTree({
        "selectMode":SelectionMode.MULTI
    });
    tree2.expandAll();

    const div = document.getElementById('test');    

    const treesDiv = document.createElement('div');
    treesDiv.className = 'trees';
   
    treesDiv.appendChild(tree._render());
    const tree2dom = tree2._render();
    tree2dom.classList.add('tree-var02');
    treesDiv.appendChild(tree2dom);


    // const tree3dom = createOtherTree(getConfGeoport());
    // treesDiv.appendChild(tree3dom);

    div.appendChild(treesDiv);


    





    const bttnDiv = document.createElement('div');
    bttnDiv.appendChild(bttn01);
    bttnDiv.appendChild(bttn02);
    div.appendChild(bttnDiv);
    // document.body.appendChild(bttn01);
    // document.body.appendChild(bttn02);

}