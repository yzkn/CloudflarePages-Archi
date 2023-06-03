// Copyright (c) 2023 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

const materialIconsBaseUri1 = 'https://raw.githubusercontent.com/google/'
const materialIconsBaseUri2 = 'material-design-icons/'
const materialIconsBaseUri3 = 'master/png/'
const materialIconsBaseUri = materialIconsBaseUri1 + materialIconsBaseUri2 + materialIconsBaseUri3 // https://raw.githubusercontent.com/google/material-design-icons/master/png/

let queries;
let toastDict;

let stored = null;

const basename = path => path.split('/').pop().split('.').shift();

const retrieveQueryDict = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlSearchParams.entries());
};

const showSpinner = () => {
    document.getElementById('icon-search-spinner').classList.remove('spinner-hidden');
    document.getElementById('icon-search').disabled = true;
};

const hideSpinner = () => {
    document.getElementById('icon-search-spinner').classList.add('spinner-hidden');
    document.getElementById('icon-search').disabled = false;
};

const loadDataSource = () => {
    const items = [
        { "url": "https://aws.amazon.com/jp/architecture/icons/", "name": "AWS" },
        { "url": "https://cloud.google.com/icons?hl=ja", "name": "Google Cloud" },
        { "url": "https://emojipedia.org/microsoft/", "name": "Segoe UI Emojis" },
        { "url": "https://fasttrack.microsoft.com/v2/en-us/resources", "name": "Microsoft Office App Icons" },
        { "url": "https://fonts.google.com/icons", "name": "Material Symbols" },
        { "url": "https://github.com/Roemer/plantuml-office", "name": "Office" },
        { "url": "https://github.com/gilbarbara/logos", "name": "Logos" },
        { "url": "https://github.com/kubernetes/community/tree/master/icons", "name": "Kubernetes" },
        { "url": "https://github.com/microsoft/PowerBI-Icons", "name": "Power BI Icons" },
        { "url": "https://learn.microsoft.com/ja-jp/azure/architecture/icons/", "name": "Azure" },
        { "url": "https://learn.microsoft.com/ja-jp/dynamics365/get-started/icons", "name": "Dynamics 365" },
        { "url": "https://learn.microsoft.com/ja-jp/power-platform/guidance/icons", "name": "Power Platform" },
        { "url": "https://news.microsoft.com/imagegallery/?filter_cats%5B%5D=2333", "name": "Microsoft Logos" },
        { "url": "https://www.microsoft.com/en-us/download/details.aspx?id=35825", "name": "Visual Studio Image Library" },
        { "url": "https://www.opensecurityarchitecture.org/cms/library/icon-library", "name": "Open Security Architecture" },
        { "url": "https://www.cisco.com/c/en/us/about/brand-center/network-topology-icons.html", "name": "Cisco Network Topology Icons" },
        { "url": "https://knowledge.sakura.ad.jp/4724/", "name": "さくらのアイコンセット" },
        { "url": "https://network.yamaha.com/support/download/tool#network_iconset", "name": "ヤマハ" },
        { "url": "https://future-architect.github.io/articles/20160721/", "name": "Future" }
    ];

    const datasourceList = document.getElementById('datasource-list');
    items.sort((a, b) => a.name > b.name ? 1 : -1).forEach(item => {
        let datasourceItem = document.createElement('div');
        datasourceItem.classList.add('list-group');
        datasourceItem.innerHTML = '<a href="' + item.url + '" target="_blank" class="list-group-item list-group-item-light"> ' + item.name + '</a>';
        datasourceList.appendChild(datasourceItem);
    });
};

const loadJson = (term = '', ignore_case = false) => {
    if (stored != null) {
        parseJson(term, ignore_case)
    } else {
        fetch(apiUri)
            .then(response => response.json())
            .then(json => {
                stored = json;
                parseJson(term, ignore_case)
                initAutocomplete()
            });
    }
};

const initAutocomplete = () => {
    if (stored != null) {
        const searchList = document.getElementById('search-list');
        const treeItems = stored.tree;
        treeItems.forEach(element => {
            const option = document.createElement('option');
            const item = element.path.replaceAll('/', ' ').replace('.png', '').replace('.svg', '');
            const ssv = item.split(' ');
            option.value = ssv[1] + ' ' + ssv[ssv.length - 1];
            searchList.appendChild(option);
        });
    }
};

const parseJson = (term = '', ignore_case = false) => {
    if (stored == null) {
        setTimeout(() => {
            parseJson(term, ignore_case);
        }, 500);
    } else {
        showSpinner();

        let imageList = document.getElementById('image-list');
        imageList.innerHTML = '';

        let filtered = stored.tree.filter((element) => {
            return ignore_case
                ?
                term.toLowerCase()
                    .split(/\s+/)
                    .map(t => element.path.toLowerCase().includes(t))
                    .every(t => t === true)
                :
                term.split(/\s+/)
                    .map(t => element.path.includes(t))
                    .every(t => t === true)
        });

        let conn = retrieveQueryDict()['conn'];
        if (conn) {
            if (conn == 't') {
                console.log('conn');
            } else {
                filtered = filtered.filter((element) => {
                    return (!element.path.includes('asset/Power_Platform_Connector/'));
                });
            }
        } else {
            filtered = filtered.filter((element) => {
                return (!element.path.includes('asset/Power_Platform_Connector/'));
            });
        }
        if (filtered.length == 0) {
            hideSpinner();
        } else {
            const sorted = filtered.sort((a, b) => {
                const na = a.path.toUpperCase();
                const nb = b.path.toUpperCase();
                if (na < nb) {
                    return -1;
                } else if (na > nb) {
                    return 1;
                } else {
                    return 0;
                }
            });

            let elementsProcessed = 0;
            sorted.forEach(element => {
                let box = document.createElement('div');
                box.classList.add('position-relative');
                box.height = 64;
                box.width = 64;

                let img = document.createElement('img');
                img.onclick = (event) => {
                    const img = event.target;
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');

                    ctx.beginPath();
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async (blob) => {
                        try {
                            const item = new ClipboardItem({
                                'image/png': blob
                            });
                            await navigator.clipboard.write([item]);
                            toastDict['toast-copied'].show();
                        } catch (error) {
                            if (error.message == 'ClipboardItem is not defined') {
                                toastDict['toast-clipboard-item'].show();
                            }
                        }
                    });
                };

                img.onload = () => {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;
                    const imgSize = String(width) + 'x' + String(height);

                    let captionBox = document.createElement('div');
                    captionBox.classList.add('position-absolute');
                    captionBox.classList.add('bottom-0');
                    captionBox.classList.add('w-100');

                    let captionLabel = document.createElement('p');
                    captionLabel.classList.add('m-0');
                    captionLabel.classList.add('px-1');
                    captionLabel.classList.add('text-end');
                    captionLabel.classList.add('text-light');
                    captionLabel.innerText = imgSize;
                    captionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    captionLabel.style.fontSize = '10px';

                    let nameBox = document.createElement('div');
                    nameBox.classList.add('position-absolute');
                    nameBox.classList.add('top-0');
                    nameBox.classList.add('w-100');

                    let nameLabel = document.createElement('p');
                    nameLabel.classList.add('m-0');
                    nameLabel.classList.add('p-0');
                    nameLabel.classList.add('text-start');
                    nameLabel.classList.add('text-nowrap');
                    nameLabel.classList.add('text-light');
                    nameLabel.innerText = basename(element.path);
                    nameLabel.style.transform = "scale(0.5)";
                    nameLabel.style.transformOrigin = "0 0";
                    nameLabel.style.fontSize = '10px';

                    box.appendChild(img);
                    captionBox.appendChild(captionLabel);
                    box.appendChild(captionBox);
                    nameBox.appendChild(nameLabel);
                    box.appendChild(nameBox);
                    imageList.appendChild(box);

                    elementsProcessed++;
                    if (elementsProcessed === sorted.length) {
                        hideSpinner();
                    }
                }

                img.alt = element.path;
                img.className = 'img-thumbnail';
                img.crossOrigin = 'anonymous';
                img.title = element.path;
                img.src = element.path.startsWith(materialIconsBaseUri2) ? element.path.replace(materialIconsBaseUri2, materialIconsBaseUri) : (baseUri + element.path);
            });
        }
    }
};

window.addEventListener('DOMContentLoaded', _ => {
    loadDataSource();

    document.getElementById('icon-search-ignorecase').addEventListener('change', _ => {
        const checked = document.getElementById('icon-search-ignorecase').checked;
        document.getElementById('icon-search-ignorecase-label').innerText = "大文字/小文字を区別"
            + (checked ? "しない" : "する");
    });

    document.querySelectorAll('.alert').forEach((alert) => new bootstrap.Alert(alert));
    toastDict = {
        'toast-copied': new bootstrap.Toast(document.getElementById('toast-copied'), {
            delay: 500,
        }),
        'toast-input-keyword': new bootstrap.Toast(document.getElementById('toast-input-keyword'), {
            delay: 2000,
        }),
        'toast-clipboard-item': new bootstrap.Toast(document.getElementById('toast-clipboard-item'), {
            autohide: false
        })
    };

    let ic = retrieveQueryDict()['ic'];
    if (ic) {
        if (ic == 't') {
            document.getElementById('icon-search-ignorecase').checked = true;
        }
    }

    let term = retrieveQueryDict()['term'];
    if (term) {
        document.getElementById('icon-search-term').value = term;

        loadJson(
            term,
            document.getElementById('icon-search-ignorecase').checked
        );
    } else {
        toastDict['toast-input-keyword'].show();
    }

    document.getElementById('icon-search').addEventListener('click', _ => {
        loadJson(
            document.getElementById('icon-search-term').value,
            document.getElementById('icon-search-ignorecase').checked
        );
    });

    document.getElementById('icon-search-term').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('icon-search').dispatchEvent(new Event('click'));
        }
    });
});
