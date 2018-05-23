const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const dialog = require('electron').remote.dialog;

window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let simplemde = null;
let workingFile = null;
let workingFoler = null;
let folderStucture = null;

let sidenav = $('.sidenav');

function initialSetup(){
    let sideNav = $('.sidenav');
    let sideNavIni = M.Sidenav.init(sideNav);

    simplemde = new SimpleMDE({
        autoDownloadFontAwesome: false,
        toolbar: [
            "bold",
            "italic",
            "strikethrough",
            {
                name: "Heading",
                action: SimpleMDE.toggleHeadingSmaller,
                className: "fa fa-heading",
                title: "Heading"
            },
            "|",
            "code",
            "quote",
            "|",
            "unordered-list",
            "ordered-list",
            "|",
            "link",
            {
                name: "Image",
                action: SimpleMDE.drawImage,
                className: "fa fa-image",
                title: "Image"
            },
            "table",
            "horizontal-rule",
            "|",
            "preview",
            "side-by-side",
            "fullscreen"

        ],
        forceSync: true,
        spellChecker: false,
        autofocus: true,
        element: document.getElementById("markdown")
    });
    simplemde.codemirror.on("change", function(){
        $('#mainarea').innerText = simplemde.value();
    });
    simplemde.codemirror.on("change", function(){
       fileOnChange();
    });
    simplemde.toggleSideBySide();
}

document.addEventListener('DOMContentLoaded', () => {
    initialSetup();
});

function fileOnChange() {
    $('#mainarea').innerText = simplemde.value();
    if(workingFile !== null){
        fs.writeFile(workingFile, simplemde.value(), (err) => {
            if(err !== null)
                alert('Error in saving file: ' + err);
        });
    }
}

ipc.on('open-new-file', (e, args) => {
    openFile();
});

const openFile = () => {
    let selectedPath = dialog.showOpenDialog({
        properties: [
            'openFile',
            'openDirectory',
            'multiSelections',
            'showHiddenFiles',
            'createDirectory',
            'promptToCreate'
        ]
    });

    if(selectedPath !== null){
        selectedPath = selectedPath[0];

        workingFoler = null;
        workingFile = null;
        folderStucture = null;

        if(fs.lstatSync(selectedPath).isDirectory()){
            workingFoler = selectedPath;
        }

        if(fs.lstatSync(selectedPath).isFile()){
            workingFoler = path.dirname(selectedPath);
            workingFile = path.filename(selectedPath);
        }

        folderStucture = dirTree(workingFoler);
        //console.log(folderStucture);
    }

    showFile();
    $('#folderloading').classList.remove('hide');
    showFolderStructure(folderStucture.children, $('.sidenav-fixed'));
    $('#folderloading').classList.add('hide');
    let collapsible = $$('.collapsible');
    let collapsibleIni = M.Collapsible.init(collapsible);

};

let showFile = () => {
    if(workingFile !== null){
        fs.readFile(workingFile, 'utf-8', function (err, data) {
            simplemde.value(data);
        });
    }
};

function dirTree(filename) {
    let stats = fs.lstatSync(filename),
        info = {
            path: filename,
            name: path.basename(filename)
        };

    if (stats.isDirectory()) {
        info.type = "folder";
        info.children = fs.readdirSync(filename).map(function(child) {
            return dirTree(filename + '/' + child);
        });
    } else {
        // Assuming it's a file. In real life it could be a symlink or
        // something else!
        if(stats.isFile())
            info.type = "file";
        else
            info.type = "none";
    }

    return info;
}

let showFolderStructure = (structure, parent) => {
    if(structure !== null){
        for(let i=0; i<structure.length; i++){
            let stru = structure[i];
            if(stru.type === 'file'){
                let ele = document.createElement('li');
                parent.appendChild(ele);

                let eleAnc = document.createElement('a');
                ele.appendChild(eleAnc);

                eleAnc.href = '#!';

                let eleIcon = document.createElement('i');
                eleAnc.appendChild(eleIcon);

                eleIcon.classList.add('material-icons');
                eleIcon.innerText = 'insert_drive_file';

                let eleSpan = document.createElement('span');
                eleAnc.appendChild(eleSpan);

                eleSpan.innerText = stru.name;

            } else if(stru.type === 'folder'){
                let ele = document.createElement('li');
                parent.appendChild(ele);

                let eleUl = document.createElement('ul');
                ele.appendChild(eleUl);

                eleUl.classList.add('collapsible');
                eleUl.classList.add('expandable');

                let eleUlLi = document.createElement('li');
                eleUl.appendChild(eleUlLi);

                let eleHeader = document.createElement('a');
                eleUlLi.appendChild(eleHeader);

                eleHeader.classList.add('collapsible-header');

                eleHeader.innerText = stru.name;

                let eleHeaderIcon = document.createElement('i');
                eleHeader.appendChild(eleHeaderIcon);

                eleHeaderIcon.classList.add('material-icons');
                eleHeaderIcon.innerText = 'folder';


                let eleBody = document.createElement('div');
                eleUlLi.appendChild(eleBody);

                eleBody.classList.add('collapsible-body');

                let eleBodyUl = document.createElement('ul');
                eleBody.appendChild(eleBodyUl);

                showFolderStructure(stru.children, eleBodyUl);
            }
        }
    }
};