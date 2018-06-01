const path = require('path');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const dialog = require('electron').remote.dialog;
const mime = require('mime-types');
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);
Element.prototype.$ = Element.prototype.querySelector;
Element.prototype.$$ = Element.prototype.querySelectorAll;

let app = {
    mde: null,
    theme: 'dark',
    folderStructure: 'open'
};
let mde = app.mde;

let files = {
    workingFolder: null,
    activeFile: null,
};
let workingFolder = files.workingFolder;

let comp = {
    sidenav: {
        ele: $('.sidenav'),
        ini: null
    },
    mdeHolder: $('#markdown'),
    markdownHolder: $('#mainarea')
};

/*
* File handling
* */

let stats = filePath => {
    return fs.lstatSync(filePath);
}; // fs.lstatSync()

let selectFile = () => {
    let selectedPath = dialog.showOpenDialog({
        title: 'Add Project Folder',
        properties: [
            'openFile',
            'openDirectory',
            'showHiddenFiles',
            'createDirectory',
            'promptToCreate'
        ]
    });

    return selectedPath[0] || null;
};

let openFile = () => {
    let selectedPath = selectFile();

    if(fs.lstatSync(selectedPath).isDirectory()){
        files.workingFolder = selectedPath;
    }

    if(fs.lstatSync(selectedPath).isFile()){
        files.workingFolder = path.dirname(selectedPath);
        files.activeFile = selectedPath;
    }

    renderFile();

    addFolderToFolderStructure(fileInfo(files.workingFolder), comp.sidenav.ele);
};

let fileInfo = (filePath) => {
    return {
        path: filePath,
        name: path.basename(filePath),
        type: (stats(filePath).isFile()) ? 'file' : ((stats(filePath).isDirectory()) ? 'folder' : null)
    };
};

let addChildToFolder = (info, parent) => {
    if(parent.getAttribute('data-child') === ('false' || null || undefined)){
        parent.setAttribute('data-child', true);
        fs.readdirSync(info.path).map(child => {
           let filePath = `${info.path}/${child}`;
           let childInfo = fileInfo(filePath);
           switch (childInfo.type){
               case 'file': addFileToFolderStructure(childInfo, parent); break;
               case 'folder': addFolderToFolderStructure(childInfo, parent); break;
           }
        });
        M.Collapsible.init(parent.parentNode.parentNode.parentNode);
    }
};

let addFileToFolderStructure = (info, parent) => {
    let ele = document.createElement('li');
    ele.innerHTML = `
    <a href="#!" draggable="false" data-path="${info.path}">
        <i class="material-icons">insert_drive_file</i>
        <span>${info.name}</span>
    </a>
    `;
    ele.$('a').addEventListener('click', () => {
        files.activeFile = info.path;
        files.workingFolder = path.dirname(info.path);
        renderFile();
    });
    parent.appendChild(ele);
};

let addFolderToFolderStructure = (info, parent) => {
    let ele = document.createElement('li');
    ele.innerHTML = `
      <ul class="collapsible expandable">
        <li class="">
          <a data-path="${info.path}" class="collapsible-header" tabindex="0">
            ${info.name}
            <i class="material-icons">folder</i>
          </a>
          <div class="collapsible-body" style="display: block;">
            <ul data-child="false"></ul>
          </div>
        </li>
      </ul>
    `;
    parent.appendChild(ele);
    ele.$('.collapsible-header').addEventListener('click', () => {
        addChildToFolder(info, ele.$('.collapsible-body>ul'));
    });
};

let renderFile = () => {
    if(files.activeFile){
        if(mime.charset(mime.lookup(files.activeFile)) === 'UTF-8'){
            console.log('d');
            fs.readFile(files.activeFile, 'UTF-8', (err, data) => {
               app.mde.value(data);
            });
        } else {
            alert('File format not supported yet.');
        }
    }
};

/*
* Events Handling
* */

ipc.on('open-new-file', () => {openFile();});
ipc.on('win-focused', () => {renderFile();});

let fileOnChange = () => {
    comp.markdownHolder.innerText = app.mde.value();
    if(files.activeFile){
        fs.writeFile(files.activeFile, app.mde.value(), err => {
            if(err)
                alert(`Error Saving File: ${err}`);
        });
    }
};

/*
* Display Actions
* */

let toggleFolderStructure = () => {
  // TODO
};

let changeTheme = () => {
    // TODO
};

/*
* initiations
*/

let mdeInit = () => {
    app.mde = new SimpleMDE({
        element: comp.mdeHolder,
        forceSync: true,
        spellCheck: true,
        autoFocus: false,
        autoDownloadFontAwesome: false,
        renderingConfig: {
            codeSyntaxHighlighting: true
        },
        toolbar: [
            {
                name: "folder structure",
                action: toggleFolderStructure,
                className: "fas fa-sitemap active"
            },
            {
                name: "theme",
                action: changeTheme,
                className: "fas fa-adjust"
            },
            "|",
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

        ]
    });

    app.mde.codemirror.on('change', () => {fileOnChange();});
    app.mde.toggleSideBySide();
};

let initialSetup = () => {
    comp.sidenav.ini = M.Sidenav.init(comp.sidenav.ele);
    mdeInit();
};

document.addEventListener('DOMContentLoaded', () => {initialSetup();});