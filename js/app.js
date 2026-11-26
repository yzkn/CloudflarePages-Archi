// Copyright (c) 2026 YA All rights reserved.


const apiUri = 'list.json';
const baseUri = 'https://archit.pages.dev/';

const materialIconsBaseUri1 = 'https://raw.githubusercontent.com/google/'
const materialIconsBaseUri2 = 'material-design-icons/'
const materialIconsBaseUri3 = 'master/png/'
const materialIconsBaseUri = materialIconsBaseUri1 + materialIconsBaseUri2 + materialIconsBaseUri3 // https://raw.githubusercontent.com/google/material-design-icons/master/png/

const msLearnIconBaseUri = 'https://msico.pages.dev/';

let queries;
let toastDict;

let stored = null;

const basename = path => path.split('/').pop().split('.').shift();
// 保存のときのファイル名（拡張子つき。URL の末尾の部分）
const filename = path => decodeURIComponent(path.split('/').pop().split('?').shift());

// 知らせ: 成功（緑）と失敗（黄）。文言は場面ごとに入れ替える
const showCopied = message => {
    document.getElementById('toast-copied-body').innerText = message;
    toastDict['toast-copied'].show();
};
const showFailed = message => {
    document.getElementById('toast-failed-body').innerText = message;
    toastDict['toast-failed'].show();
};

// 元の形式・大きさのまま保存する（PNG に変えない。SVG は SVG のまま）
const downloadImage = async (url, path) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename(path);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (error) {
        console.error(error);
        showFailed('ダウンロードできませんでした（' + error.message + '）。');
    }
};

// 画像の URL をクリップボードにコピーする
const copyImageUrl = async url => {
    try {
        await navigator.clipboard.writeText(url);
        showCopied('画像の URL をコピーしました。');
    } catch (error) {
        console.error(error);
        showFailed('URL をコピーできませんでした（' + error.message + '）。');
    }
};

// 出典で絞り込むチップ: 選んだ出典のキー（空なら、すべて）
let selectedSources = new Set();
const connectorSource = 'Power_Platform_Connector';

// path の先頭の部分から出典のキーを作る（asset/<出典>/...・material-design-icons/...・https://msico.pages.dev/...）
const sourceKey = path => path.startsWith(msLearnIconBaseUri)
    ? 'msico'
    : (path.startsWith('asset/') ? path.split('/')[1] : path.split('/')[0]);

// チップに出す名前。無いキーは、記号を空白に置き換えて出す（新しい出典も自動で並ぶ）
const sourceLabels = {
    'Cisco-3015_jpeg': 'Cisco',
    'Dynamics_365_Icons_scalable': 'Dynamics 365',
    'Google_Cloud_Basic_Cards': 'Google Cloud',
    'Microsoft_Fasttrack': 'Microsoft Office App',
    'OpenSecurityArchitecture': 'Open Security Architecture',
    'PowerBI-Icons-main': 'Power BI',
    'Power_Platform_Connector': 'Power Platform コネクタ',
    'Power_Platform_scalable': 'Power Platform',
    'Sakura': 'さくら',
    'Visual_Studio_2022_Image_Library': 'Visual Studio',
    'Yamaha': 'ヤマハ',
    'future-architect': 'Future',
    'material-design-icons': 'Material',
    'msico': 'Microsoft Learn',
};
const sourceLabel = key => sourceLabels[key] || key.replace(/[_-]+/g, ' ');

const renderSourceFilter = (counts, total, term, ignore_case) => {
    const container = document.getElementById('source-filter');
    container.innerHTML = '';

    const makeChip = (label, count, active, onClick) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.classList.add('btn', 'btn-sm', 'rounded-pill', 'text-nowrap', active ? 'btn-secondary' : 'btn-outline-secondary');
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        chip.innerText = label + ' ' + count;
        chip.addEventListener('click', onClick);
        container.appendChild(chip);
    };

    makeChip('すべて', total, selectedSources.size === 0, () => {
        selectedSources.clear();
        parseJson(term, ignore_case);
    });
    Object.keys(counts)
        .sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b), 'ja'))
        .forEach(key => {
            makeChip(sourceLabel(key), counts[key], selectedSources.has(key), () => {
                if (selectedSources.has(key)) {
                    selectedSources.delete(key);
                } else {
                    selectedSources.add(key);
                }
                parseJson(term, ignore_case);
            });
        });

    container.classList.toggle('d-none', Object.keys(counts).length === 0);
};

// 大文字・小文字の切り替えの文言（どこで切り替えても同じ表記にする）
const updateIgnoreCaseLabel = () => {
    const checked = document.getElementById('icon-search-ignorecase').checked;
    document.getElementById('icon-search-ignorecase-label').innerText = '大文字/小文字を区別' + (checked ? 'しない' : 'する');
};

const retrieveQueryDict = () => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return Object.fromEntries(urlSearchParams.entries());
};

// 検索の条件を URL に書き戻す（?term=…&ic=f&ts=…）。履歴は増やさない。既定の値は書かない。ほかの引数（conn など）は残す
const updateQueryString = () => {
    const params = new URLSearchParams(window.location.search);
    const term = document.getElementById('icon-search-term').value.trim();
    const ignoreCase = document.getElementById('icon-search-ignorecase').checked;
    const ts = document.getElementById('icon-copy-transparent-select').value;
    term !== '' ? params.set('term', term) : params.delete('term');
    ignoreCase ? params.delete('ic') : params.set('ic', 'f');
    ts !== 'none' ? params.set('ts', ts) : params.delete('ts');
    const query = params.toString();
    const next = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
        history.replaceState(history.state, '', next);
    }
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
        {
            "url": "https://aws.amazon.com/jp/architecture/icons/",
            "name": "AWS"
        },
        {
            "url": "https://cloud.google.com/icons?hl=ja",
            "name": "Google Cloud"
        },
        {
            "url": "https://emojipedia.org/microsoft/",
            "name": "Segoe UI Emojis"
        },
        {
            "url": "https://fasttrack.microsoft.com/v2/en-us/resources",
            "name": "Microsoft Office App Icons"
        },
        {
            "url": "https://fonts.google.com/icons",
            "name": "Material Symbols"
        },
        {
            "url": "https://github.com/Roemer/plantuml-office",
            "name": "Office"
        },
        {
            "url": "https://github.com/gilbarbara/logos",
            "name": "Logos"
        },
        {
            "url": "https://github.com/kubernetes/community/tree/master/icons",
            "name": "Kubernetes"
        },
        {
            "url": "https://github.com/microsoft/PowerBI-Icons",
            "name": "Power BI Icons"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/azure/architecture/icons/",
            "name": "Azure アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/dynamics365/get-started/icons",
            "name": "Microsoft Dynamics 365 アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/entra/architecture/architecture-icons",
            "name": "Microsoft Entra ID アーキテクチャ アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/fabric/fundamentals/icons",
            "name": "Microsoft Fabric アイコン"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/power-platform/guidance/icons",
            "name": "Power Platform"
        },
        {
            "url": "https://news.microsoft.com/imagegallery/?filter_cats%5B%5D=2333",
            "name": "Microsoft Logos"
        },
        {
            "url": "https://learn.microsoft.com/ja-jp/microsoft-365/solutions/architecture-icons-templates",
            "name": "Microsoft 365 アーキテクチャのアイコンとテンプレート"
        },
        {
            "url": "https://www.microsoft.com/en-us/download/details.aspx?id=35825",
            "name": "Visual Studio Image Library"
        },
        {
            "url": "https://www.opensecurityarchitecture.org/cms/library/icon-library",
            "name": "Open Security Architecture"
        },
        {
            "url": "https://www.cisco.com/c/en/us/about/brand-center/network-topology-icons.html",
            "name": "Cisco Network Topology Icons"
        },
        {
            "url": "https://knowledge.sakura.ad.jp/4724/",
            "name": "さくらのアイコンセット"
        },
        {
            "url": "https://network.yamaha.com/support/download/tool#network_iconset",
            "name": "ヤマハ"
        },
        {
            "url": "https://future-architect.github.io/articles/20160721/",
            "name": "Future"
        }
    ];

    const datasourceList = document.getElementById('datasource-list');
    items.sort((a, b) => a.name > b.name ? 1 : -1).forEach(item => {
        let datasourceItem = document.createElement('div');
        datasourceItem.classList.add('list-group');
        datasourceItem.innerHTML = '<a href="' + item.url + '" target="_blank" class="list-group-item list-group-item-light"> ' + item.name + '</a>';
        datasourceList.appendChild(datasourceItem);
    });
};

// 検索用の索引（初回に 1 回だけ作る）。並び順（path の大文字で比べた順）に並べておき、
// 各件の path と description をつないだ文字列（そのままと小文字）と、出典のキーを前もって持つ
let searchIndex = null;
// 補完の候補（重複を除いたもの）
let suggestions = [];
// list.json の取得は 1 回だけ（打つたびの検索で、読み込み中に何度も取得しない）
let loading = null;

const buildIndex = () => {
    const compare = (a, b) => a.upper < b.upper ? -1 : (a.upper > b.upper ? 1 : 0);
    searchIndex = stored.tree
        .map(element => {
            const text = element.path + '\n' + element.description;
            return {
                element,
                text,
                lower: text.toLowerCase(),
                source: sourceKey(element.path),
                upper: element.path.toUpperCase(),
            };
        })
        .sort(compare);

    const seen = new Set();
    stored.tree.forEach(element => {
        const ssv = element.path.replaceAll('/', ' ').replace('.png', '').replace('.svg', '').split(' ');
        const value = ssv[1] + ' ' + ssv[ssv.length - 1];
        if (!seen.has(value)) {
            seen.add(value);
            suggestions.push({ value, lower: value.toLowerCase() });
        }
    });
};

const ensureLoaded = () => {
    if (loading == null) {
        loading = fetch(apiUri)
            .then(response => response.json())
            .then(json => {
                stored = json;
                buildIndex();
                updateSuggestions(document.getElementById('icon-search-term').value);
            })
            .catch(error => {
                loading = null; // 次の検索で取り直す
                hideSpinner();
                throw error;
            });
    }
    return loading;
};

const loadJson = (term = '', ignore_case = false) => {
    showSpinner();
    ensureLoaded().then(() => parseJson(term, ignore_case));
};

// 補完の候補: 2 文字以上になってから、当たるもの（前方一致を先に）の上位 suggestionLimit 件だけを置く
const suggestionLimit = 50;
const updateSuggestions = value => {
    const searchList = document.getElementById('search-list');
    searchList.innerHTML = '';
    const v = value.trim().toLowerCase();
    if (v.length < 2 || searchIndex == null) {
        return;
    }
    const prefix = [];
    const contains = [];
    for (const s of suggestions) {
        if (s.lower.startsWith(v)) {
            prefix.push(s.value);
            if (prefix.length >= suggestionLimit) {
                break;
            }
        } else if (contains.length < suggestionLimit && s.lower.includes(v)) {
            contains.push(s.value);
        }
    }
    const fragment = document.createDocumentFragment();
    prefix.concat(contains).slice(0, suggestionLimit).forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        fragment.appendChild(option);
    });
    searchList.appendChild(fragment);
};

// 当たった件数の表示
const showResultCount = count => {
    const label = document.getElementById('result-count');
    if (count == null) {
        label.innerText = '';
        label.classList.add('d-none');
    } else {
        label.innerText = count + ' 件';
        label.classList.remove('d-none');
    }
};

// 検索の結果は、並び順どおりに pageSize 件ずつ置く（当たった全件の画像を一度に要求しない）
const pageSize = 200;
// 検索の世代。新しい検索を始めたら、前の検索の画像の読み込みの知らせは数えない
let searchGeneration = 0;

// 結果の下の「さらに表示」のボタン。残りが無ければ消す
const updateMoreButton = (remaining, onClick) => {
    let more = document.getElementById('image-more');
    if (remaining <= 0) {
        if (more) {
            more.remove();
        }
        return;
    }
    if (!more) {
        more = document.createElement('button');
        more.id = 'image-more';
        more.type = 'button';
        more.classList.add('btn', 'btn-outline-secondary', 'd-block', 'mx-auto', 'my-3');
        document.getElementById('image-list').after(more);
    }
    more.innerText = 'さらに表示（残り ' + remaining + ' 件）';
    more.onclick = onClick;
};

const parseJson = (term = '', ignore_case = false) => {
    if (searchIndex == null) {
        loadJson(term, ignore_case);
    } else {
        showSpinner();
        const generation = ++searchGeneration;
        updateQueryString();

        let imageList = document.getElementById('image-list');
        imageList.innerHTML = '';
        updateMoreButton(0);

        // 語は空白で区切り、すべてを含むものに絞る（索引は並べ替え済みなので、結果も並び順どおり）
        const terms = (ignore_case ? term.toLowerCase() : term).split(/\s+/).filter(t => t !== '');
        const field = ignore_case ? 'lower' : 'text';
        let filtered = searchIndex.filter(entry => terms.every(t => entry[field].includes(t)));

        // 出典ごとの件数（チップに出す）。キーワードで絞ったあと、出典で絞る前の数
        const counts = {};
        filtered.forEach(entry => {
            counts[entry.source] = (counts[entry.source] || 0) + 1;
        });
        // 今回の結果に無い出典の選択は外す（チップが消えて外せなくなるため）
        selectedSources.forEach(key => {
            if (!counts[key]) {
                selectedSources.delete(key);
            }
        });

        // Power Platform のコネクタは、?conn=t か、そのチップを選んだときだけ出す
        const showConnector = retrieveQueryDict()['conn'] == 't' || selectedSources.has(connectorSource);
        if (!showConnector) {
            filtered = filtered.filter(entry => entry.source !== connectorSource);
        }
        renderSourceFilter(counts, filtered.length, term, ignore_case);

        if (selectedSources.size > 0) {
            filtered = filtered.filter(entry => selectedSources.has(entry.source));
        }
        showResultCount(filtered.length);
        if (filtered.length == 0) {
            hideSpinner();
        } else {
            const sorted = filtered.map(entry => entry.element);

            // 置いた件数と、そのうち画像の読み込みが終わった（失敗も含む）件数
            let rendered = 0;
            let elementsProcessed = 0;
            const countProcessed = () => {
                if (generation !== searchGeneration) {
                    return;
                }
                elementsProcessed++;
                if (elementsProcessed === rendered) {
                    hideSpinner();
                }
            };
            // 1 件分の枠を作る。枠は先に並び順どおりに置き、画像は読み込めたら枠に入れる
            const renderBox = element => {
                let box = document.createElement('div');
                box.classList.add('position-relative');
                box.height = 64;
                box.width = 64;
                box.style.minWidth = '64px';
                box.style.minHeight = '64px';

                let img = document.createElement('img');
                img.onclick = (event) => {
                    const img = event.target;
                    if (!img.naturalWidth || !img.naturalHeight) {
                        // 寸法を持たない SVG などは PNG にできない（黙って失敗させない）
                        showFailed('この画像は PNG としてコピーできません。右上の ⬇ でダウンロードしてください。');
                        return;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');

                    const tsCondition = document.getElementById('icon-copy-transparent-select').value;

                    if (tsCondition == 'lightgray-to-transparent') {
                        ctx.drawImage(img, 0, 0);
                        const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imagedata.data;
                        for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
                            if (data[i] >= 240 && data[i + 1] >= 240 && data[i + 2] >= 240 && data[i] === data[i + 1] && data[i + 1] === data[i + 2]) {
                                // data[i] = 0;
                                // data[i + 1] = 0;
                                // data[i + 2] = 0;
                                data[i + 3] = 0; // アルファ値を0にして透明にする
                            }
                        }
                        ctx.putImageData(imagedata, 0, 0);
                    } else if (tsCondition == 'white-to-transparent') {
                        ctx.drawImage(img, 0, 0);
                        const imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imagedata.data;
                        for (let i = 0; i < canvas.width * canvas.height * 4; i += 4) {
                            if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
                                data[i + 3] = 0; // アルファ値を0にして透明にする
                            }
                        }
                        ctx.putImageData(imagedata, 0, 0);
                    } else if (tsCondition == 'white-background') {
                        ctx.beginPath();
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                    } else if (tsCondition == 'none') {
                        ctx.drawImage(img, 0, 0);
                    }

                    // Safari はクリックの中で write を呼ぶ必要があるので、Blob の Promise を渡す
                    const blobPromise = new Promise((resolve, reject) => {
                        try {
                            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG にできませんでした')), 'image/png');
                        } catch (error) {
                            // 画像の読み込み元が CORS を許していないと、canvas から取り出せない
                            reject(error);
                        }
                    });
                    (async () => {
                        try {
                            if (typeof ClipboardItem === 'undefined') {
                                throw new Error('ClipboardItem is not defined');
                            }
                            const item = new ClipboardItem({
                                'image/png': blobPromise
                            });
                            await navigator.clipboard.write([item]);
                            showCopied('画像（PNG）をクリップボードにコピーしました。');
                        } catch (error) {
                            console.error(error);
                            if (error.message == 'ClipboardItem is not defined') {
                                toastDict['toast-clipboard-item'].show();
                            } else {
                                showFailed('画像をコピーできませんでした（' + error.message + '）。');
                            }
                        }
                    })();
                };

                img.onload = () => {
                    const width = img.naturalWidth;
                    const height = img.naturalHeight;
                    const imgSize = String(width) + 'x' + String(height);

                    let captionBox = document.createElement('div');
                    captionBox.classList.add('position-absolute');
                    captionBox.classList.add('w-100');
                    // 名前を枠の下に出すので、寸法は画像の下端に合わせる
                    captionBox.style.top = '64px';
                    captionBox.style.transform = 'translateY(-100%)';

                    let captionLabel = document.createElement('p');
                    captionLabel.classList.add('m-0');
                    captionLabel.classList.add('px-1');
                    captionLabel.classList.add('text-end');
                    captionLabel.classList.add('text-light');
                    captionLabel.innerText = imgSize;
                    captionLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                    captionLabel.style.fontSize = '10px';

                    let nameBox = document.createElement('div');
                    nameBox.classList.add('w-100');

                    // 名前は枠の下に 1 行で出す（長いものは省略記号。全体はツールチップ）
                    let nameLabel = document.createElement('p');
                    nameLabel.classList.add('m-0');
                    nameLabel.classList.add('px-1');
                    nameLabel.classList.add('text-center');
                    nameLabel.classList.add('text-truncate');
                    nameLabel.classList.add('text-body');
                    nameLabel.innerText = basename(element.path);
                    nameLabel.title = basename(element.path);
                    nameLabel.style.fontSize = '11px';

                    // 元の形式のまま保存・URL をコピーするボタン（PC ではマウスを載せたとき、タッチの端末では常に出す）
                    let actions = document.createElement('div');
                    actions.classList.add('icon-actions', 'position-absolute', 'top-0', 'end-0', 'd-flex');
                    const makeAction = (label, title, onClick) => {
                        const button = document.createElement('button');
                        button.type = 'button';
                        button.classList.add('icon-action', 'btn', 'btn-light', 'p-0');
                        button.innerText = label;
                        button.title = title;
                        button.setAttribute('aria-label', title + '（' + basename(element.path) + '）');
                        button.addEventListener('click', e => {
                            e.stopPropagation();
                            onClick();
                        });
                        actions.appendChild(button);
                    };
                    makeAction('⬇', '元の形式・大きさでダウンロード', () => downloadImage(img.src, element.path));
                    makeAction('🔗', '画像の URL をコピー', () => copyImageUrl(img.src));

                    box.appendChild(img);
                    box.appendChild(actions);
                    captionBox.appendChild(captionLabel);
                    box.appendChild(captionBox);
                    nameBox.appendChild(nameLabel);
                    box.appendChild(nameBox);

                    countProcessed();
                }

                img.onerror = () => {
                    // 読み込めない画像も完了に数える（数えないと検索ボタンが戻らない）
                    let failedBox = document.createElement('div');
                    failedBox.classList.add('img-thumbnail');
                    failedBox.classList.add('d-flex');
                    failedBox.classList.add('align-items-center');
                    failedBox.classList.add('justify-content-center');
                    failedBox.classList.add('text-center');
                    failedBox.classList.add('text-secondary');
                    failedBox.style.width = '64px';
                    failedBox.style.height = '64px';
                    failedBox.style.fontSize = '10px';
                    failedBox.innerText = '読み込めません';
                    failedBox.title = element.path + "\n---\n" + element.description + "\n（画像を読み込めませんでした）";

                    box.appendChild(failedBox);

                    countProcessed();
                };

                img.alt = element.path;
                img.className = 'img-thumbnail';
                img.crossOrigin = 'anonymous';
                img.title = element.path + "\n---\n" + element.description + "\n（クリックで PNG としてクリップボードにコピー。右上の ⬇ で元の形式のまま保存、🔗 で URL をコピー）";
                img.src = element.path.startsWith(msLearnIconBaseUri) ? element.path : (element.path.startsWith(materialIconsBaseUri2) ? element.path.replace(materialIconsBaseUri2, materialIconsBaseUri) : (baseUri + element.path));
                return box;
            };
            const renderPage = () => {
                const fragment = document.createDocumentFragment();
                const page = sorted.slice(rendered, rendered + pageSize);
                rendered += page.length;
                page.forEach(element => {
                    fragment.appendChild(renderBox(element));
                });
                imageList.appendChild(fragment);
                updateMoreButton(sorted.length - rendered, () => {
                    showSpinner();
                    renderPage();
                });
            };
            renderPage();
        }
    }
};

const typingDelay = 200;
let typingTimer = null;
const scheduleSearch = () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        const term = document.getElementById('icon-search-term').value;
        if (term.trim() === '') {
            // 結果と件数を消す（空のまま全件を出さない。全件は Search ボタンで出せる）
            searchGeneration++;
            document.getElementById('image-list').innerHTML = '';
            updateMoreButton(0);
            renderSourceFilter({}, 0, '', false);
            showResultCount(null);
            hideSpinner();
            updateQueryString();
            return;
        }
        loadJson(term, document.getElementById('icon-search-ignorecase').checked);
    }, typingDelay);
};

window.addEventListener('DOMContentLoaded', _ => {
    loadDataSource();

    document.getElementById('icon-search-ignorecase').addEventListener('change', updateIgnoreCaseLabel);

    document.querySelectorAll('.alert').forEach((alert) => new bootstrap.Alert(alert));
    toastDict = {
        'toast-copied': new bootstrap.Toast(document.getElementById('toast-copied'), {
            delay: 2000,
        }),
        'toast-failed': new bootstrap.Toast(document.getElementById('toast-failed'), {
            delay: 5000,
        }),
        'toast-input-keyword': new bootstrap.Toast(document.getElementById('toast-input-keyword'), {
            delay: 2000,
        }),
        'toast-clipboard-item': new bootstrap.Toast(document.getElementById('toast-clipboard-item'), {
            autohide: false
        })
    };

    // クエリパラメーターをもとに設定: icon-search-ignorecase（既定は区別しない。ic=f で区別する。ic=t は以前の URL のため）
    let ic = retrieveQueryDict()['ic'];
    if (ic == 'f') {
        document.getElementById('icon-search-ignorecase').checked = false;
    } else if (ic == 't') {
        document.getElementById('icon-search-ignorecase').checked = true;
    }
    updateIgnoreCaseLabel();

    // クエリパラメーターをもとに設定: icon-copy-transparent-select
    let ts = retrieveQueryDict()['ts'];
    if (ts) {
        if (ts == 'none' || ts == 'white-to-transparent' || ts == 'white-background' || ts == 'lightgray-to-transparent') {
            let optionElement = document.getElementById('icon-copy-transparent-select').querySelector('option[value="' + ts + '"]');
            optionElement.selected = true;
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
            clearTimeout(typingTimer);
            document.getElementById('icon-search').dispatchEvent(new Event('click'));
        }
    });

    // 打つたびに絞り込む（入力が止まって typingDelay ms 後）。空にしたら結果を消す
    document.getElementById('icon-search-term').addEventListener('input', e => {
        const value = e.target.value;
        updateSuggestions(value);
        if (value.trim() !== '') {
            ensureLoaded();
        }
        scheduleSearch();
    });
    // 大文字・小文字の切り替えも、入力があれば検索しなおす
    document.getElementById('icon-search-ignorecase').addEventListener('change', _ => {
        updateQueryString();
        if (document.getElementById('icon-search-term').value.trim() !== '') {
            scheduleSearch();
        }
    });
    // コピーの設定（透明の扱い）も URL に残す
    document.getElementById('icon-copy-transparent-select').addEventListener('change', updateQueryString);
});
