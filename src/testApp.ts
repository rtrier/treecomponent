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

function start() {
    console.info("TEST");

    const treeParam:TreeParam = {
        "selectMode":SelectionMode.MULTI
    }

    const tree = new Tree(null, treeParam);

    tree.onSelectionChange.subscribe(nodeChanged);

    const div = document.getElementById('test');    
    div.appendChild(tree._render());


    
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
            }
        }
    }


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
    document.body.appendChild(bttn01);
    document.body.appendChild(bttn02);

}