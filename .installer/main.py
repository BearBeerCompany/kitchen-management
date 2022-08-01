import PySimpleGUI as sg
import requests
import tarfile

sg.theme("Reddit")
layout = [
    [sg.Text("Seleziona la versione da installare", justification='center')],
    [[sg.Radio('Windows', "VERSION", default=True)],
     [sg.Radio('Linux', "VERSION", default=False)]],
    [sg.Text("Seleziona la cartella di installazione: ")],
    [sg.In(size=(70, 1), enable_events=True, key='FOLDER'), sg.FolderBrowse()],
    [sg.Button("Installa", key="OK", size=100, disabled=True)],
    [sg.ProgressBar(max_value=10, orientation='h', size=(100, 20), key='PROGRESS')],
    [sg.Multiline(size=(100, 30), key='OUT_LOG', disabled=True, autoscroll=True)]
]
window = sg.Window('Gestione Piastre Installer', layout, size=(600, 600))
folder = ""
log = ""
release_detail = "https://api.github.com/repos/bozzelliandrea/kitchen-management/releases/tags/v0.0.1-RC1"
current_size = 0
file_total_size = 0
file_chunk_size = 500000


def logger(message):
    global log
    if log == "":
        log = message
    else:
        log = log + '\n' + message
    window['OUT_LOG'].update(value=log)


def download_file(url, file_path):
    logger('Starting download file....')
    local_filename = file_path + '/' + url.split('/')[-1]
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=file_chunk_size):
                update_progress_bar(file_chunk_size)
                f.write(chunk)
    logger('Download Complete')
    return local_filename


def get_remote_size_and_url(url):
    response = requests.get(url)
    json_object = response.json()
    return [json_object['assets'][0]['size'], json_object['assets'][0]['browser_download_url']]


def update_progress_bar(chunk):
    global current_size
    current_size += chunk
    logger(f'current: {current_size}, total: {file_total_size}')
    window['PROGRESS'].UpdateBar(current_size, file_total_size)


def extract_tar(file_path):
    logger('Starting file installation')
    release_tar = tarfile.open(file_path)
    release_tar.extractall('./gestione_piastre')
    release_tar.close()
    logger('Installation Completed!')


if __name__ == "__main__":
    while True:
        event, values = window.read()
        if event == sg.WIN_CLOSED:
            break
        elif event == 'FOLDER':
            folder = values['FOLDER']
            if folder is not None:
                window['OK'].update(disabled=False)
        elif event.startswith('UPDATE_'):
            logger(f'event: {event}, value: {values[event]}')
            key_to_update = event[len('UPDATE_'):]
            window[key_to_update].update(values[event])
            window.refresh()
            continue
        elif event == 'OK':
            logger(f'Selected folder: {folder}')
            download_info = get_remote_size_and_url(release_detail)
            file_total_size = download_info[0]
            logger(f'File Size: {download_info[0]}' + '\n' + f'Download remote from: {download_info[1]}')
            local_file = download_file(download_info[1], folder)
            extract_tar(local_file)
