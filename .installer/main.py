import PySimpleGUI as sg
import requests

sg.theme("Reddit")
layout = [
    [sg.Text("Seleziona la versione da installare", justification='center')],
    [[sg.Radio('Windows', "VERSION", default=True)],
     [sg.Radio('Linux', "VERSION", default=False)]],
    [sg.Text("Seleziona la cartella di installazione: ")],
    [sg.In(size=(25, 1), enable_events=True, key='FOLDER'), sg.FolderBrowse()],
    [sg.Button("Installa", key="OK", size=100, disabled=True)],
    [sg.Multiline(size=(100, 10), key='OUT_LOG')]
]
window = sg.Window('Gestione Piastre Installer', layout, size=(300, 300))
folder = ""
log = ""
release = "https://github.com/bozzelliandrea/kitchen-management/releases/download/v0.0.1-RC1/release.tgz"


def download_file(url, fil_path):
    local_filename = fil_path + '/' + url.split('/')[-1]
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_filename


def get_remote_size(url):
    response = requests.head(url)
    print('\r\n'.join('{}: {}'.format(k, v) for k, v in response.headers.items()))
    return response.headers['content-length']


while True:
    event, values = window.read()
    if event == sg.WIN_CLOSED:
        break
    elif event == "FOLDER":
        folder = values['FOLDER']
        if folder is not None:
            window['OK'].update(disabled=False)
    elif event == "OK":
        log = folder
        window['OUT_LOG'].update(value=log)
        size = get_remote_size(release)
        log = log + '\n' + 'File Size: ' + size
        window['OUT_LOG'].update(value=log)
        log = log + '\n' + 'Starting download file....'
        window['OUT_LOG'].update(value=log)
        local_file = download_file(release)
        local_file = "bla bla"
        log = log + '\n' + 'Download Complete' + '\n' + local_file
        window['OUT_LOG'].update(value=log)

window.close()
