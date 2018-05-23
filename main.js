const {app, BrowserWindow, Menu, globalShortcut} = require('electron');
const path = require('path');
const url = require('url');
const dialog = require('electron').dialog;

let win;

app.on('ready', () => {
    setMenus();
    createWindow();
    globalShortcut.register('CommandOrControl+Q', () => {
        // quit();
    })
});

app.on('activate', () => {
   if(win==null)
       createWindow()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
}
});

exports.openFile = () => {

    let files = dialog.showOpenDialog({
        properties: [
            'openFile',
            'openDirectory',
            'multiSelections'
        ]
    });
    return files;
};



function createWindow() {

    win = new BrowserWindow({
        width: 993,
        height: 800,
        minWidth: 993,
        minHeight: 800,
        backgroundColor: '#ffffff',
        show: false
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // inspect element
    win.webContents.openDevTools();

    win.once('ready-to-show', () => {
        win.show()
    });

    win.on('closed', () => {
        // make a want to exit dialog here
        win = null;
    });

}

function setMenus(){
    let menu = Menu.buildFromTemplate([
        {
            label: "MarkIT",
            submenu: [
                {
                    label: "Setting",
                    click(){
                        // setting();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: "About MarkIT",
                    click(){
                        // about();
                    }
                },
                {
                    label: "About Faisal",
                    click(){
                        // aboutFaisal();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    click(){
                        // quit();
                    }
                }
            ]
        },
        {
            label: "File",
            submenu: [
                {
                    label: 'New Window',
                    click(){
                        createWindow();
                    }
                },
                {
                    label: 'Close Window',
                    click(){
                        let currWin = BrowserWindow.getFocusedWindow();
                        if(currWin !== null)
                            currWin.close();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Add New Project',
                    click(){
                        // addProject();
                    }
                },
                {
                    label: 'Close All Projects',
                    click(){
                        // closeAllProjects();
                    }
                },
                {
                    type: 'separator'
                },
                {
                  label: 'Open File',
                  click(){
                      openFile();
                  }
                },
                {
                    label: 'New File',
                    click(){
                        // newFile();
                    }
                },
                {
                    label: 'Save',
                    click(){
                        // save();
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);
}