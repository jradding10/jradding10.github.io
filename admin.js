(function () {
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;

    var OWNER = 'jradding10';
    var REPO = 'jradding10.github.io';
    var BRANCH = 'main';
    var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
    var TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
    var DOCS = [
        { key: 'site', path: 'site.json', label: 'page text' },
        { key: 'experience', path: 'experience.json', label: 'experience' },
        { key: 'projects', path: 'projects.json', label: 'projects' },
        { key: 'apps', path: 'apps.json', label: 'apps' }
    ];
    var TYPES = ['Project', 'Publication', 'Research'];
    var IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    var FILE_TYPES = IMAGE_TYPES.concat(['application/pdf']);
    var MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
    var MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

    /* ---------- Helpers ---------- */

    var asset = function (path) { return /^[a-z]+:/i.test(path) || /^#/.test(path) ? path : encodeURI(path); };

    function setAdminFlag(on) {
        // Only a marker that shows "Edit" buttons on the main site. The token is never stored.
        try {
            if (on) window.localStorage.setItem('jr-admin', '1');
            else window.localStorage.removeItem('jr-admin');
        } catch (e) { /* storage blocked: the site just won't show edit buttons */ }
    }

    function gh(token, path, opts) {
        opts = opts || {};
        return fetch(API + path, {
            method: opts.method || 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'Content-Type': 'application/json'
            },
            body: opts.body ? JSON.stringify(opts.body) : undefined,
            cache: 'no-store'
        }).then(function (r) {
            return r.text().then(function (txt) {
                var data = null;
                try { data = txt ? JSON.parse(txt) : null; } catch (e) { /* not JSON */ }
                if (!r.ok) {
                    var err = new Error((data && data.message) || ('GitHub returned ' + r.status));
                    err.status = r.status;
                    throw err;
                }
                return data;
            });
        });
    }

    function b64ToText(b64) {
        var bin = atob(b64.replace(/\s/g, ''));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }

    function slugify(text) {
        return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    }

    function fileSafeName(name) {
        var dot = name.lastIndexOf('.');
        var base = dot > 0 ? name.slice(0, dot) : name;
        var ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin';
        return (slugify(base) || 'file') + '.' + ext;
    }

    function readAsBase64(file) {
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onload = function () { resolve(String(fr.result).split(',')[1]); };
            fr.onerror = function () { reject(fr.error); };
            fr.readAsDataURL(file);
        });
    }

    function trimList(list) {
        return (list || []).map(function (x) { return String(x).trim(); }).filter(Boolean);
    }

    function cleanLinks(links) {
        return (links || []).map(function (l) { return { label: (l.label || '').trim(), href: (l.href || '').trim() }; })
            .filter(function (l) { return l.label || l.href; });
    }

    var CLEAN = {
        projects: function (list) {
            return list.map(function (p) {
                return {
                    id: p.id,
                    type: p.type,
                    meta: (p.meta || '').trim(),
                    title: (p.title || '').trim(),
                    full: (p.full || '').trim() || (p.title || '').trim(),
                    tags: trimList(p.tags),
                    summary: (p.summary || '').trim(),
                    body: trimList(p.body),
                    images: (p.images || []).map(function (im) { return { src: im.src, alt: (im.alt || '').trim() }; }),
                    links: cleanLinks(p.links)
                };
            });
        },
        experience: function (list) {
            return list.map(function (t) {
                var out = {
                    id: t.id,
                    when: (t.when || '').trim(),
                    role: (t.role || '').trim(),
                    org: (t.org || '').trim(),
                    points: trimList(t.points),
                    tags: trimList(t.tags)
                };
                if (t.lead) out.lead = true;
                return out;
            });
        },
        apps: function (list) {
            return list.map(function (a) {
                return {
                    id: a.id,
                    name: (a.name || '').trim(),
                    tagline: (a.tagline || '').trim(),
                    meta: (a.meta || '').trim(),
                    tech: trimList(a.tech),
                    description: trimList(a.description),
                    repo: (a.repo || '').trim(),
                    download: { label: ((a.download || {}).label || '').trim(), href: ((a.download || {}).href || '').trim() },
                    links: cleanLinks(a.links),
                    images: (a.images || []).map(function (im) { return { src: im.src, alt: (im.alt || '').trim() }; })
                };
            });
        },
        site: function (s) {
            return {
                hero: {
                    eyebrow: (s.hero.eyebrow || '').trim(),
                    name: (s.hero.name || '').trim(),
                    lede: (s.hero.lede || '').trim(),
                    buttons: cleanLinks(s.hero.buttons)
                },
                about: {
                    photo: s.about.photo || '',
                    photoAlt: (s.about.photoAlt || '').trim(),
                    intro: (s.about.intro || '').trim(),
                    paragraphs: trimList(s.about.paragraphs)
                },
                linkedin: {
                    show: s.linkedin.show !== false,
                    heading: (s.linkedin.heading || '').trim(),
                    lead: (s.linkedin.lead || '').trim(),
                    url: (s.linkedin.url || '').trim(),
                    label: (s.linkedin.label || '').trim()
                },
                contact: {
                    heading: (s.contact.heading || '').trim(),
                    lead: (s.contact.lead || '').trim(),
                    buttons: cleanLinks(s.contact.buttons)
                },
                footer: (s.footer || '').trim()
            };
        }
    };

    function linkProblems(links, where) {
        var errors = [];
        (links || []).forEach(function (l) {
            var label = (l.label || '').trim(), href = (l.href || '').trim();
            if (!label && !href) return;
            if (!label || !href) errors.push(where + ' has a link or button without both a label and an address.');
            else if (!/^(https?:\/\/|mailto:|tel:|#|[a-zA-Z0-9_])/.test(href)) errors.push(where + ' has an address that should start with https://.');
        });
        return errors;
    }

    function validate(data) {
        var errors = [];
        var seen = {};
        data.projects.forEach(function (p) {
            var name = '“' + ((p.title || '').trim() || p.id) + '”';
            var add = function (msg) { errors.push({ tab: 'projects', id: p.id, msg: msg }); };
            if (!(p.title || '').trim()) add('A project is missing its title.');
            if (!(p.summary || '').trim()) add(name + ' needs a one-line summary.');
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) add(name + ' has a link name with characters other than lowercase letters, numbers and dashes.');
            if (seen[p.id]) add('Two projects share the link name “' + p.id + '”.');
            seen[p.id] = true;
            linkProblems(p.links, name).forEach(add);
        });
        data.experience.forEach(function (t) {
            if (!(t.role || '').trim() || !(t.org || '').trim()) {
                errors.push({ tab: 'experience', id: t.id, msg: 'Each experience entry needs a role and an organization.' });
            }
        });
        var seenApp = {};
        data.apps.forEach(function (a) {
            var name = '\u201C' + ((a.name || '').trim() || a.id) + '\u201D';
            var add = function (msg) { errors.push({ tab: 'apps', id: a.id, msg: msg }); };
            if (!(a.name || '').trim()) add('An app is missing its name.');
            if (!(a.tagline || '').trim()) add(name + ' needs a one-line description.');
            if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.id)) add(name + ' has a link name with characters other than lowercase letters, numbers and dashes.');
            if (seenApp[a.id]) add('Two apps share the link name \u201C' + a.id + '\u201D.');
            seenApp[a.id] = true;
            if ((a.repo || '').trim() && !/^https:\/\//.test(a.repo.trim())) add(name + ' has a GitHub address that should start with https://.');
            linkProblems([a.download || {}], name + '\u2019s download').concat(linkProblems(a.links, name)).forEach(add);
        });
        if (!(data.site.hero.name || '').trim()) errors.push({ tab: 'site', msg: 'The hero needs your name.' });
        if (data.site.linkedin.show !== false && !/^https:\/\//.test((data.site.linkedin.url || '').trim())) {
            errors.push({ tab: 'site', msg: 'The LinkedIn section needs your profile address, starting with https://.' });
        }
        linkProblems(data.site.hero.buttons, 'The hero').concat(linkProblems(data.site.contact.buttons, 'The contact section'))
            .forEach(function (msg) { errors.push({ tab: 'site', msg: msg }); });
        return errors;
    }

    function describeChanges(changed, before, after) {
        var lines = [];
        if (changed.site) lines.push('Update page text');
        if (changed.experience) lines.push('Update experience');
        if (changed.apps) {
            var ba = {};
            before.apps.forEach(function (a) { ba[a.id] = JSON.stringify(a); });
            var aIds = after.apps.map(function (a) { return a.id; });
            var na = lines.length;
            after.apps.forEach(function (a) {
                if (!(a.id in ba)) lines.push('Add app ' + a.name);
                else if (ba[a.id] !== JSON.stringify(a)) lines.push('Edit app ' + a.name);
            });
            before.apps.forEach(function (a) { if (aIds.indexOf(a.id) === -1) lines.push('Remove app ' + a.name); });
            if (lines.length === na) lines.push('Reorder apps');
        }
        if (changed.projects) {
            var b = {};
            before.projects.forEach(function (p) { b[p.id] = JSON.stringify(p); });
            var ids = after.projects.map(function (p) { return p.id; });
            var n = lines.length;
            after.projects.forEach(function (p) {
                if (!(p.id in b)) lines.push('Add ' + p.title);
                else if (b[p.id] !== JSON.stringify(p)) lines.push('Edit ' + p.title);
            });
            before.projects.forEach(function (p) { if (ids.indexOf(p.id) === -1) lines.push('Remove ' + p.title); });
            if (lines.length === n) lines.push('Reorder projects');
        }
        return lines;
    }

    function errorMessage(err) {
        if (err.status === 401) return 'GitHub did not accept that token. It may have expired or been copied incompletely. Sign out and sign in with a fresh token.';
        if (err.status === 403) return 'This token can read your site but not change it. Create a token with Contents set to “Read and write”.';
        if (err.status === 404) return 'This token cannot see the ' + REPO + ' repository. When creating the token, choose “Only select repositories” and pick ' + REPO + '.';
        if (err.status === 409 || err.status === 422) return 'Your site changed on GitHub while you were editing. Your edits are still on this page: copy any text you need, then reload to get the latest version.';
        return err.message || 'Something went wrong talking to GitHub. Check your connection and try again.';
    }

    function moveItem(list, i, d) {
        var j = i + d;
        if (j < 0 || j >= list.length) return list;
        var arr = list.slice();
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        return arr;
    }

    /* ---------- Login ---------- */

    function Login(props) {
        var tS = useState(''), token = tS[0], setToken = tS[1];
        var bS = useState(false), busy = bS[0], setBusy = bS[1];
        var eS = useState(''), error = eS[0], setError = eS[1];

        function submit(e) {
            e.preventDefault();
            var t = token.trim();
            if (!t) { setError('Paste your GitHub token to sign in.'); return; }
            setBusy(true);
            setError('');
            gh(t, '').then(function () {
                props.onLogin(t);
            }).catch(function (err) {
                setBusy(false);
                setError(errorMessage(err));
            });
        }

        return h('main', { className: 'admin-login wrap' },
            h('div', { className: 'login-card' },
                h('p', { className: 'kicker' }, 'Site admin'),
                h('h1', null, 'Sign in to edit your site'),
                h('p', { className: 'muted' }, 'Changes you publish here are saved to your GitHub repository and appear on jacquelineradding.com about a minute later.'),
                h('form', { onSubmit: submit, className: 'login-form' },
                    h('label', { htmlFor: 'login-user' }, 'GitHub account'),
                    h('input', { id: 'login-user', name: 'username', autoComplete: 'username', value: OWNER, readOnly: true }),
                    h('label', { htmlFor: 'login-token' }, 'Access token'),
                    h('input', {
                        id: 'login-token', name: 'password', type: 'password', autoComplete: 'current-password',
                        value: token, onChange: function (e) { setToken(e.target.value); }, placeholder: 'github_pat_…'
                    }),
                    error && h('p', { className: 'form-error', role: 'alert' }, error),
                    h('button', { type: 'submit', className: 'btn small', disabled: busy }, busy ? 'Checking…' : 'Sign in')
                ),
                h('details', { className: 'help' },
                    h('summary', null, 'How to get a token (one time, about 2 minutes)'),
                    h('ol', null,
                        h('li', null, 'Open ', h('a', { href: TOKEN_URL, target: '_blank', rel: 'noopener' }, 'GitHub: new fine-grained token'), '.'),
                        h('li', null, 'Name it “Website admin” and pick an expiration, for example 90 days.'),
                        h('li', null, 'Under Repository access, choose “Only select repositories” and pick ', h('b', null, REPO), '.'),
                        h('li', null, 'Under Permissions, set ', h('b', null, 'Contents'), ' to “Read and write”. Leave everything else as is.'),
                        h('li', null, 'Generate the token, copy it and paste it above. Let your browser’s password manager save it so you don’t need to paste it again.')
                    ),
                    h('p', { className: 'muted' }, 'This page never stores the token. It only lives in this tab until you sign out or close it.')
                )
            )
        );
    }

    /* ---------- Form pieces ---------- */

    function Field(props) {
        return h('div', { className: 'field' + (props.wide ? ' wide' : '') },
            props.id ? h('label', { htmlFor: props.id }, props.label) : h('span', { className: 'label' }, props.label),
            props.hint && h('p', { className: 'hint-text' }, props.hint),
            props.children
        );
    }

    function Text(props) {
        var attrs = {
            id: props.id, value: props.value || '', placeholder: props.placeholder, maxLength: props.maxLength,
            readOnly: props.readOnly, rows: props.rows,
            onChange: function (e) { props.onChange(e.target.value); }
        };
        return h(Field, props, props.multiline ? h('textarea', attrs) : h('input', attrs));
    }

    // List fields (paragraphs, bullet lines, tags) keep their own raw text so typing stays natural.
    function ListText(props) {
        var sep = props.mode === 'paragraphs' ? '\n\n' : props.mode === 'lines' ? '\n' : ', ';
        var sS = useState((props.value || []).join(sep)), text = sS[0], setText = sS[1];
        function parse(v) {
            if (props.mode === 'paragraphs') return v.split(/\n[ \t]*\n/);
            if (props.mode === 'lines') return v.split('\n');
            return v.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
        }
        var multiline = props.mode !== 'tags';
        var attrs = {
            id: props.id, value: text, placeholder: props.placeholder, rows: props.rows || (props.mode === 'paragraphs' ? 10 : 5),
            onChange: function (e) { setText(e.target.value); props.onChange(parse(e.target.value)); }
        };
        return h(Field, props, multiline ? h('textarea', attrs) : h('input', attrs));
    }

    function UploadButton(props) {
        var ref = useRef(null);
        return h(React.Fragment, null,
            h('input', {
                ref: ref, type: 'file', className: 'sr', accept: props.accept.join(','), multiple: !!props.multiple,
                tabIndex: -1, 'aria-hidden': 'true',
                onChange: function (e) {
                    var files = Array.prototype.slice.call(e.target.files || []);
                    e.target.value = '';
                    if (files.length) props.onFiles(files);
                }
            }),
            h('button', { type: 'button', className: props.className || 'btn small outline', onClick: function () { ref.current && ref.current.click(); } }, props.label)
        );
    }

    function LinksEditor(props) {
        var links = props.links || [];
        var eS = useState(''), error = eS[0], setError = eS[1];
        function update(next) { props.onChange(next); }
        function set(i, key, val) {
            var arr = links.slice();
            arr[i] = Object.assign({}, arr[i]);
            arr[i][key] = val;
            update(arr);
        }
        var p = props.prefix;
        return h(Field, { label: props.label, hint: props.hint, wide: true },
            h('ul', { className: 'link-list' },
                links.map(function (l, i) {
                    return h('li', { key: i, className: 'link-row' },
                        h('label', { htmlFor: p + '-label-' + i, className: 'sr' }, 'Label ' + (i + 1)),
                        h('input', { id: p + '-label-' + i, value: l.label, placeholder: 'Label, e.g. Read the report', onChange: function (e) { set(i, 'label', e.target.value); } }),
                        h('label', { htmlFor: p + '-href-' + i, className: 'sr' }, 'Address ' + (i + 1)),
                        h('input', { id: p + '-href-' + i, value: l.href, placeholder: 'https://… or upload a PDF', onChange: function (e) { set(i, 'href', e.target.value); } }),
                        h('div', { className: 'row-tools' },
                            h(UploadButton, {
                                label: 'Upload', className: 'tool-btn', accept: FILE_TYPES,
                                onFiles: function (files) {
                                    setError('');
                                    props.upload(files[0], 'files').then(function (path) {
                                        var arr = links.slice();
                                        arr[i] = { label: arr[i].label || files[0].name.replace(/\.[^.]+$/, ''), href: path };
                                        update(arr);
                                    }).catch(function (err) { setError(err.message); });
                                }
                            }),
                            h('button', { type: 'button', onClick: function () { update(moveItem(links, i, -1)); }, disabled: i === 0, 'aria-label': 'Move up' }, '↑'),
                            h('button', { type: 'button', onClick: function () { update(links.filter(function (_, n) { return n !== i; })); }, 'aria-label': 'Remove' }, '×'))
                    );
                })
            ),
            h('button', { type: 'button', className: 'btn small outline', onClick: function () { update(links.concat([{ label: '', href: '' }])); } }, props.addLabel || 'Add link'),
            error && h('p', { className: 'form-error', role: 'alert' }, error)
        );
    }

    function ImagesEditor(props) {
        var images = props.images || [];
        var eS = useState(''), error = eS[0], setError = eS[1];
        function update(next) { props.onChange(next); }

        function onFiles(files) {
            setError('');
            Promise.all(files.map(function (f) {
                return props.upload(f, props.folder, true).then(function (path) {
                    return { src: path, alt: f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') };
                }, function (err) { return { error: err.message }; });
            })).then(function (results) {
                var ok = results.filter(function (r) { return !r.error; });
                var bad = results.filter(function (r) { return r.error; }).map(function (r) { return r.error; });
                update(images.concat(ok));
                if (bad.length) setError(bad.join(' '));
            });
        }

        return h(Field, { label: 'Images', hint: 'The first image is shown first. Describe each one in a few words; that text is the caption.', wide: true },
            images.length === 0 && h('p', { className: 'empty-note' }, 'No images yet. Without one, a blue title card is shown.'),
            h('ul', { className: 'img-list' },
                images.map(function (im, i) {
                    return h('li', { key: im.src + i, className: 'img-row' },
                        h('img', { src: props.preview(im.src), alt: '' }),
                        h('div', { className: 'img-meta' },
                            h('label', { htmlFor: 'img-alt-' + i, className: 'sr' }, 'Caption for image ' + (i + 1)),
                            h('input', {
                                id: 'img-alt-' + i, value: im.alt, placeholder: 'What the image shows',
                                onChange: function (e) {
                                    var arr = images.slice();
                                    arr[i] = { src: im.src, alt: e.target.value };
                                    update(arr);
                                }
                            }),
                            h('small', null, im.src, props.isPending(im.src) ? ' (uploads when you publish)' : '')
                        ),
                        h('div', { className: 'row-tools' },
                            h('button', { type: 'button', onClick: function () { update(moveItem(images, i, -1)); }, disabled: i === 0, 'aria-label': 'Move image up' }, '↑'),
                            h('button', { type: 'button', onClick: function () { update(moveItem(images, i, 1)); }, disabled: i === images.length - 1, 'aria-label': 'Move image down' }, '↓'),
                            h('button', { type: 'button', onClick: function () { update(images.filter(function (_, n) { return n !== i; })); }, 'aria-label': 'Remove image' }, '×'))
                    );
                })
            ),
            h(UploadButton, { label: 'Upload images', accept: IMAGE_TYPES, multiple: true, onFiles: onFiles }),
            error && h('p', { className: 'form-error', role: 'alert' }, error)
        );
    }

    function TwoStepDelete(props) {
        var cS = useState(false), confirm = cS[0], setConfirm = cS[1];
        useEffect(function () { setConfirm(false); }, [props.resetKey]);
        return h('div', { className: 'danger' },
            confirm
                ? h(React.Fragment, null,
                    h('span', null, props.question),
                    h('button', { type: 'button', className: 'btn small danger-btn', onClick: props.onDelete }, 'Yes, remove it'),
                    h('button', { type: 'button', className: 'btn small outline', onClick: function () { setConfirm(false); } }, 'Keep it'))
                : h('button', { type: 'button', className: 'link-btn', onClick: function () { setConfirm(true); } }, props.label)
        );
    }

    // A list on the left, the selected item's form on the right. Used for projects and experience.
    function ListEditor(props) {
        var items = props.items;
        var current = items.filter(function (it) { return it.id === props.selected; })[0];
        var index = items.indexOf(current);
        return h('div', { className: 'admin-grid' },
            h('aside', { className: 'admin-list' },
                h('button', { className: 'btn small', onClick: props.onAdd }, props.addLabel),
                h('ol', null,
                    items.map(function (it, i) {
                        var on = it === current;
                        return h('li', { key: i, className: 'alist-item' + (on ? ' on' : '') },
                            h('button', { className: 'alist-main', onClick: function () { props.onSelect(it.id); }, 'aria-current': on ? 'true' : undefined },
                                h('strong', null, props.titleOf(it)),
                                h('small', null, props.subOf(it))),
                            h('div', { className: 'row-tools' },
                                h('button', { onClick: function () { props.onItems(moveItem(items, i, -1)); }, disabled: i === 0, 'aria-label': 'Move ' + props.titleOf(it) + ' up' }, '↑'),
                                h('button', { onClick: function () { props.onItems(moveItem(items, i, 1)); }, disabled: i === items.length - 1, 'aria-label': 'Move ' + props.titleOf(it) + ' down' }, '↓'))
                        );
                    })
                ),
                h('p', { className: 'hint-text' }, 'The order here is the order on your site.')
            ),
            h('section', { className: 'admin-form' },
                current
                    ? h(React.Fragment, { key: index },
                        props.renderForm(current, function (patch) {
                            props.onItems(items.map(function (it) { return it === current ? Object.assign({}, it, patch) : it; }));
                            if (patch.id && patch.id !== current.id) props.onSelect(patch.id);
                        }),
                        h(TwoStepDelete, {
                            resetKey: current.id, label: props.deleteLabel,
                            question: 'Remove “' + props.titleOf(current) + '” from the site?',
                            onDelete: function () {
                                var rest = items.filter(function (it) { return it !== current; });
                                props.onItems(rest);
                                var next = rest[Math.max(0, index - 1)];
                                props.onSelect(next ? next.id : null);
                            }
                        }))
                    : h('p', { className: 'empty-note' }, 'Nothing selected. Add one to get started.')
            )
        );
    }

    /* ---------- Tabs ---------- */

    function ProjectForm(props) {
        var p = props.item, change = props.change;
        return h('form', { className: 'pform', onSubmit: function (e) { e.preventDefault(); } },
            h('div', { className: 'pform-head' },
                h('p', { className: 'kicker' }, p._new ? 'New project' : 'Editing project'),
                h('h2', null, p.title || 'Untitled project')),
            h('div', { className: 'grid' },
                h(Text, {
                    id: 'p-title', label: 'Short title', hint: 'Shown in the project list.', value: p.title,
                    onChange: function (v) { var patch = { title: v }; if (p._autoId) patch.id = slugify(v) || p.id; change(patch); }
                }),
                h(Text, { id: 'p-full', label: 'Full title', hint: 'Heading on the project page. Leave blank to reuse the short title.', value: p.full, onChange: function (v) { change({ full: v }); } }),
                h(Field, { id: 'p-type', label: 'Type' },
                    h('select', { id: 'p-type', value: p.type, onChange: function (e) { change({ type: e.target.value }); } },
                        TYPES.concat(TYPES.indexOf(p.type) === -1 ? [p.type] : []).map(function (t) { return h('option', { key: t, value: t }, t); }))),
                h(Text, { id: 'p-meta', label: 'Course or context', hint: 'e.g. EE 449, 2024, or Simulink.', value: p.meta, onChange: function (v) { change({ meta: v }); } }),
                h(Text, { id: 'p-summary', label: 'One-line summary', hint: 'Shown under the title in the list.', wide: true, maxLength: 200, value: p.summary, onChange: function (v) { change({ summary: v }); } }),
                h(ListText, { key: p.id + '-body', id: 'p-body', label: 'Description', hint: 'Leave a blank line between paragraphs.', wide: true, mode: 'paragraphs', rows: 12, value: p.body, onChange: function (v) { change({ body: v }); } }),
                h(ListText, { key: p.id + '-tags', id: 'p-tags', label: 'Tags', hint: 'Separate with commas. Visitors can click a tag to search for it.', wide: true, mode: 'tags', placeholder: 'PCB, RF, Simulink', value: p.tags, onChange: function (v) { change({ tags: v }); } }),
                h(ImagesEditor, { images: p.images, folder: 'images/projects/' + p.id, upload: props.upload, preview: props.preview, isPending: props.isPending, onChange: function (v) { change({ images: v }); } }),
                h(LinksEditor, {
                    prefix: 'p-link', label: 'Links', links: p.links, upload: props.upload,
                    hint: 'Reports, slides, videos or code. Upload a PDF, or paste a link. Google Drive files must be shared as “Anyone with the link”.',
                    onChange: function (v) { change({ links: v }); }
                }),
                h(Text, {
                    id: 'p-id', label: 'Link name', wide: true, readOnly: !p._new, value: p.id,
                    hint: 'Used in the project’s web address (?project=' + (p.id || '…') + ').' + (p._new ? ' Lowercase letters, numbers and dashes.' : ' Locked for published projects so existing links keep working.'),
                    onChange: function (v) { change({ id: v.toLowerCase(), _autoId: false }); }
                })
            )
        );
    }

    function ExperienceForm(props) {
        var t = props.item, change = props.change;
        return h('form', { className: 'pform', onSubmit: function (e) { e.preventDefault(); } },
            h('div', { className: 'pform-head' },
                h('p', { className: 'kicker' }, 'Editing experience'),
                h('h2', null, (t.role || 'New role') + (t.org ? ' / ' + t.org : ''))),
            h('div', { className: 'grid' },
                h(Text, { id: 'x-org', label: 'Organization', value: t.org, placeholder: 'e.g. Cisco', onChange: function (v) { change({ org: v }); } }),
                h(Text, { id: 'x-role', label: 'Role', value: t.role, placeholder: 'e.g. Product Engineer', onChange: function (v) { change({ role: v }); } }),
                h(Text, { id: 'x-when', label: 'Dates', value: t.when, placeholder: 'e.g. Aug 2025 – Present', onChange: function (v) { change({ when: v }); } }),
                h(Field, { label: 'Highlight' },
                    h('label', { className: 'check', htmlFor: 'x-lead' },
                        h('input', { id: 'x-lead', type: 'checkbox', checked: !!t.lead, onChange: function (e) { change({ lead: e.target.checked }); } }),
                        ' Show with a bright accent (use for your current role)')),
                h(ListText, { key: t.id + '-pts', id: 'x-points', label: 'Bullet points', hint: 'One per line.', wide: true, mode: 'lines', rows: 6, value: t.points, onChange: function (v) { change({ points: v }); } }),
                h(ListText, { key: t.id + '-tags', id: 'x-tags', label: 'Tags', hint: 'Separate with commas.', wide: true, mode: 'tags', value: t.tags, onChange: function (v) { change({ tags: v }); } })
            )
        );
    }

    function AppForm(props) {
        var a = props.item, change = props.change;
        var dl = a.download || { label: '', href: '' };
        var eS = useState(''), error = eS[0], setError = eS[1];
        function setDl(key, val) { var next = Object.assign({}, dl); next[key] = val; change({ download: next }); }
        return h('form', { className: 'pform', onSubmit: function (e) { e.preventDefault(); } },
            h('div', { className: 'pform-head' },
                h('p', { className: 'kicker' }, a._new ? 'New app' : 'Editing app'),
                h('h2', null, a.name || 'Untitled app')),
            h('div', { className: 'grid' },
                h(Text, {
                    id: 'a-name', label: 'Name', value: a.name, placeholder: 'e.g. You Shall Not Pass',
                    onChange: function (v) { var patch = { name: v }; if (a._autoId) patch.id = slugify(v) || a.id; change(patch); }
                }),
                h(Text, { id: 'a-meta', label: 'Label', hint: 'Short context, e.g. FPGA / 2021 or Python.', value: a.meta, onChange: function (v) { change({ meta: v }); } }),
                h(Text, { id: 'a-tagline', label: 'One-line description', hint: 'Shown on the app\u2019s card.', wide: true, maxLength: 200, value: a.tagline, onChange: function (v) { change({ tagline: v }); } }),
                h(ListText, { key: a.id + '-tech', id: 'a-tech', label: 'Languages and tools', hint: 'Separate with commas.', wide: true, mode: 'tags', placeholder: 'Python, React, SystemVerilog', value: a.tech, onChange: function (v) { change({ tech: v }); } }),
                h(Text, { id: 'a-repo', label: 'GitHub repository', hint: 'Paste the repository\u2019s web address. Visitors get a \u201CView on GitHub\u201D button.', wide: true, value: a.repo, placeholder: 'https://github.com/jradding10/\u2026', onChange: function (v) { change({ repo: v }); } }),
                h(Field, { label: 'Download', wide: true, hint: 'Upload a file (up to 25 MB), or paste a link such as a GitHub release or the repository\u2019s .zip (add /archive/refs/heads/main.zip to the repository address).' },
                    h('div', { className: 'link-row' },
                        h('label', { htmlFor: 'a-dl-label', className: 'sr' }, 'Download button text'),
                        h('input', { id: 'a-dl-label', value: dl.label, placeholder: 'Button text, e.g. Download (.zip)', onChange: function (e) { setDl('label', e.target.value); } }),
                        h('label', { htmlFor: 'a-dl-href', className: 'sr' }, 'Download address'),
                        h('input', { id: 'a-dl-href', value: dl.href, placeholder: 'https://\u2026 or upload a file', onChange: function (e) { setDl('href', e.target.value); } }),
                        h('div', { className: 'row-tools' },
                            h(UploadButton, {
                                label: 'Upload', className: 'tool-btn', accept: ['*/*'],
                                onFiles: function (files) {
                                    setError('');
                                    props.upload(files[0], 'downloads/' + a.id, 'any').then(function (path) {
                                        change({ download: { label: dl.label || 'Download ' + files[0].name, href: path } });
                                    }).catch(function (err) { setError(err.message); });
                                }
                            }),
                            (dl.label || dl.href) && h('button', { type: 'button', 'aria-label': 'Clear download', onClick: function () { change({ download: { label: '', href: '' } }); } }, '\u00D7'))),
                    error && h('p', { className: 'form-error', role: 'alert' }, error)),
                h(ListText, { key: a.id + '-desc', id: 'a-desc', label: 'Details', hint: 'Shown when a visitor opens the card. Leave a blank line between paragraphs.', wide: true, mode: 'paragraphs', rows: 10, value: a.description, onChange: function (v) { change({ description: v }); } }),
                h(ImagesEditor, { images: a.images, folder: 'images/apps/' + a.id, upload: props.upload, preview: props.preview, isPending: props.isPending, onChange: function (v) { change({ images: v }); } }),
                h(LinksEditor, { prefix: 'a-link', label: 'More links', hint: 'Demo videos, reports or a live version.', links: a.links, upload: props.upload, onChange: function (v) { change({ links: v }); } }),
                h(Text, {
                    id: 'a-id', label: 'Link name', wide: true, readOnly: !a._new, value: a.id,
                    hint: 'Used in the app\u2019s web address (jacquelineradding.com/apps/?app=' + (a.id || '\u2026') + ').' + (a._new ? ' Lowercase letters, numbers and dashes.' : ' Locked for published apps so existing links keep working.'),
                    onChange: function (v) { change({ id: v.toLowerCase(), _autoId: false }); }
                })
            )
        );
    }

    function SiteForm(props) {
        var s = props.site;
        function set(section, key, val) {
            var next = Object.assign({}, s);
            if (section) { next[section] = Object.assign({}, s[section]); next[section][key] = val; }
            else next[key] = val;
            props.onChange(next);
        }
        var photoErr = useState(''), pErr = photoErr[0], setPErr = photoErr[1];
        return h('form', { className: 'pform site-form', onSubmit: function (e) { e.preventDefault(); } },
            h('fieldset', null,
                h('legend', null, 'Top of the page'),
                h('div', { className: 'grid' },
                    h(Text, { id: 's-name', label: 'Your name', hint: 'Each word goes on its own line.', value: s.hero.name, onChange: function (v) { set('hero', 'name', v); } }),
                    h(Text, { id: 's-eyebrow', label: 'Line above your name', value: s.hero.eyebrow, onChange: function (v) { set('hero', 'eyebrow', v); } }),
                    h(Text, { id: 's-lede', label: 'Line under your name', wide: true, multiline: true, rows: 2, value: s.hero.lede, onChange: function (v) { set('hero', 'lede', v); } }),
                    h(LinksEditor, {
                        prefix: 's-hero-btn', label: 'Buttons', addLabel: 'Add button', links: s.hero.buttons, upload: props.upload,
                        hint: 'The first button is solid, the rest are outlined. Use #projects or #contact to jump down the page, or upload a PDF such as your resume.',
                        onChange: function (v) { set('hero', 'buttons', v); }
                    })
                )),
            h('fieldset', null,
                h('legend', null, 'About'),
                h('div', { className: 'grid' },
                    h(Field, { label: 'Photo', wide: true },
                        h('div', { className: 'photo-row' },
                            s.about.photo
                                ? h('img', { src: props.preview(s.about.photo), alt: '', className: 'photo-thumb' })
                                : h('p', { className: 'empty-note' }, 'No photo. The About text fills the width.'),
                            h('div', { className: 'btn-row' },
                                h(UploadButton, {
                                    label: s.about.photo ? 'Replace photo' : 'Upload photo', accept: IMAGE_TYPES,
                                    onFiles: function (files) {
                                        setPErr('');
                                        props.upload(files[0], 'images/uploads', true).then(function (path) { set('about', 'photo', path); })
                                            .catch(function (err) { setPErr(err.message); });
                                    }
                                }),
                                s.about.photo && h('button', { type: 'button', className: 'link-btn', onClick: function () { set('about', 'photo', ''); } }, 'Remove photo'))),
                        pErr && h('p', { className: 'form-error', role: 'alert' }, pErr)),
                    h(Text, { id: 's-photo-alt', label: 'Photo description', hint: 'Read aloud by screen readers.', wide: true, value: s.about.photoAlt, onChange: function (v) { set('about', 'photoAlt', v); } }),
                    h(Text, { id: 's-intro', label: 'Opening line (large text)', wide: true, multiline: true, rows: 2, value: s.about.intro, onChange: function (v) { set('about', 'intro', v); } }),
                    h(ListText, { id: 's-about', label: 'Paragraphs', hint: 'Leave a blank line between paragraphs.', wide: true, mode: 'paragraphs', value: s.about.paragraphs, onChange: function (v) { set('about', 'paragraphs', v); } })
                )),
            h('fieldset', null,
                h('legend', null, 'LinkedIn'),
                h('div', { className: 'grid' },
                    h(Field, { label: 'Show the LinkedIn section', wide: true },
                        h('label', { className: 'check', htmlFor: 's-li-show' },
                            h('input', { id: 's-li-show', type: 'checkbox', checked: s.linkedin.show !== false, onChange: function (e) { set('linkedin', 'show', e.target.checked); } }),
                            ' Show the band between Projects and Contact')),
                    h(Text, { id: 's-li-url', label: 'Profile address', wide: true, value: s.linkedin.url, placeholder: 'https://www.linkedin.com/in/\u2026', onChange: function (v) { set('linkedin', 'url', v); } }),
                    h(Text, { id: 's-li-heading', label: 'Heading', value: s.linkedin.heading, onChange: function (v) { set('linkedin', 'heading', v); } }),
                    h(Text, { id: 's-li-label', label: 'Button text', value: s.linkedin.label, onChange: function (v) { set('linkedin', 'label', v); } }),
                    h(Text, { id: 's-li-lead', label: 'Line under the heading', wide: true, value: s.linkedin.lead, onChange: function (v) { set('linkedin', 'lead', v); } })
                )),
            h('fieldset', null,
                h('legend', null, 'Contact and footer'),
                h('div', { className: 'grid' },
                    h(Text, { id: 's-contact-h', label: 'Heading', wide: true, value: s.contact.heading, onChange: function (v) { set('contact', 'heading', v); } }),
                    h(Text, { id: 's-contact-lead', label: 'Line under the heading', wide: true, value: s.contact.lead, onChange: function (v) { set('contact', 'lead', v); } }),
                    h(LinksEditor, {
                        prefix: 's-contact-btn', label: 'Buttons', addLabel: 'Add button', links: s.contact.buttons, upload: props.upload,
                        hint: 'For email, use mailto: then your address, e.g. mailto:you@example.com.',
                        onChange: function (v) { set('contact', 'buttons', v); }
                    }),
                    h(Text, { id: 's-footer', label: 'Footer text', wide: true, value: s.footer, onChange: function (v) { set(null, 'footer', v); } })
                ))
        );
    }

    /* ---------- Editor ---------- */

    function Editor(props) {
        var token = props.token;
        var want = null;
        try { want = new URLSearchParams(window.location.search).get('edit'); } catch (e) { /* ignore */ }

        var lS = useState({ state: 'loading' }), load = lS[0], setLoad = lS[1];
        var dS = useState(null), data = dS[0], setData = dS[1];
        var wantTab = null;
        try { wantTab = new URLSearchParams(window.location.search).get('tab'); } catch (e) { /* ignore */ }
        var tabS = useState(['site', 'experience', 'projects', 'apps'].indexOf(wantTab) !== -1 ? wantTab : 'projects'), tab = tabS[0], setTab = tabS[1];
        var selA = useState(null), selApp = selA[0], setSelApp = selA[1];
        var selP = useState(null), selProject = selP[0], setSelProject = selP[1];
        var selX = useState(null), selExp = selX[0], setSelExp = selX[1];
        var uS = useState({}), pending = uS[0], setPending = uS[1];
        var vS = useState({}), previews = vS[0], setPreviews = vS[1];
        var stS = useState(null), status = stS[0], setStatus = stS[1];
        var base = useRef({ head: null, blobs: {}, original: {}, paths: {} });

        function fetchData() {
            setLoad({ state: 'loading' });
            setStatus(null);
            return gh(token, '/git/ref/heads/' + BRANCH).then(function (ref) {
                var head = ref.object.sha;
                return Promise.all([
                    gh(token, '/git/trees/' + head + '?recursive=1'),
                    Promise.all(DOCS.map(function (d) { return gh(token, '/contents/' + d.path + '?ref=' + head); }))
                ]).then(function (res) {
                    var paths = {};
                    (res[0].tree || []).forEach(function (e) { paths[e.path] = true; });
                    var next = {}, blobs = {}, original = {};
                    DOCS.forEach(function (d, i) {
                        next[d.key] = JSON.parse(b64ToText(res[1][i].content));
                        blobs[d.key] = res[1][i].sha;
                        original[d.key] = JSON.stringify(CLEAN[d.key](next[d.key]));
                    });
                    base.current = { head: head, blobs: blobs, original: original, paths: paths };
                    setData(next);
                    setPending({});
                    var p = next.projects;
                    setSelProject(p.some(function (x) { return x.id === want; }) ? want : (p[0] ? p[0].id : null));
                    setSelExp(next.experience[0] ? next.experience[0].id : null);
                    var ap = next.apps;
                    setSelApp(ap.some(function (x) { return x.id === want; }) ? want : (ap[0] ? ap[0].id : null));
                    setLoad({ state: 'ready' });
                });
            }).catch(function (err) {
                setLoad({ state: 'error', msg: errorMessage(err) });
            });
        }

        useEffect(function () { fetchData(); }, []);

        var changed = {};
        var cleaned = {};
        if (data) {
            DOCS.forEach(function (d) {
                cleaned[d.key] = CLEAN[d.key](data[d.key]);
                changed[d.key] = JSON.stringify(cleaned[d.key]) !== base.current.original[d.key];
            });
        }
        var dirty = !!data && DOCS.some(function (d) { return changed[d.key]; });

        useEffect(function () {
            function warn(e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } }
            window.addEventListener('beforeunload', warn);
            return function () { window.removeEventListener('beforeunload', warn); };
        }, [dirty]);

        function setDoc(key, value) {
            setData(function (prev) { var o = Object.assign({}, prev); o[key] = value; return o; });
            setStatus(null);
        }

        // Stage a file for upload. It is committed together with the text on Publish.
        // kind: true for images only, 'any' for downloadable files, otherwise PDFs and images.
        function upload(file, folder, kind) {
            var anyFile = kind === 'any';
            var allowed = kind === true ? IMAGE_TYPES : FILE_TYPES;
            if (!anyFile && allowed.indexOf(file.type) === -1) {
                return Promise.reject(new Error(file.name + (kind === true ? ' is not a JPG, PNG, GIF or WebP image.' : ' is not a PDF or image.')));
            }
            var limit = anyFile ? MAX_DOWNLOAD_BYTES : MAX_UPLOAD_BYTES;
            if (file.size > limit) {
                return Promise.reject(new Error(file.name + ' is larger than ' + (limit / 1024 / 1024) + ' MB. Make it smaller, or attach it to a GitHub release and paste that link instead.'));
            }
            var name = fileSafeName(file.name);
            var path = folder + '/' + name;
            var n = 2;
            while (base.current.paths[path] || pending[path]) {
                path = folder + '/' + name.replace(/(\.[a-z0-9]+)$/, '-' + n + '$1');
                n++;
            }
            pending[path] = true; // reserve the name for uploads started in the same click
            return readAsBase64(file).then(function (b64) {
                setPending(function (prev) { var o = Object.assign({}, prev); o[path] = b64; return o; });
                setPreviews(function (prev) { var o = Object.assign({}, prev); o[path] = URL.createObjectURL(file); return o; });
                setStatus(null);
                return path;
            });
        }

        function preview(path) { return previews[path] || asset(path); }
        function isPending(path) { return typeof pending[path] === 'string'; }

        function publish() {
            var errors = validate(data);
            if (errors.length) {
                var first = errors[0];
                setTab(first.tab);
                if (first.tab === 'projects' && first.id) setSelProject(first.id);
                if (first.tab === 'experience' && first.id) setSelExp(first.id);
                if (first.tab === 'apps' && first.id) setSelApp(first.id);
                setStatus({ kind: 'error', msg: errors.map(function (e) { return e.msg; }).join(' ') });
                return;
            }
            var before = {};
            DOCS.forEach(function (d) { before[d.key] = JSON.parse(base.current.original[d.key]); });
            var lines = describeChanges(changed, before, cleaned);
            var allText = DOCS.map(function (d) { return JSON.stringify(cleaned[d.key]); }).join('');
            var uploads = Object.keys(pending).filter(function (path) {
                return typeof pending[path] === 'string' && allText.indexOf(JSON.stringify(path)) !== -1;
            });
            var docs = DOCS.filter(function (d) { return changed[d.key]; });

            setStatus({ kind: 'saving', msg: 'Publishing…' });

            var head;
            gh(token, '/git/ref/heads/' + BRANCH).then(function (ref) {
                head = ref.object.sha;
                if (head === base.current.head) return null;
                // Something else committed since this page loaded: continue only if the files being saved are untouched.
                return Promise.all(docs.map(function (d) {
                    return gh(token, '/contents/' + d.path + '?ref=' + head).then(function (file) {
                        if (file.sha !== base.current.blobs[d.key]) { var err = new Error('conflict'); err.status = 409; throw err; }
                    });
                }));
            }).then(function () {
                return gh(token, '/git/commits/' + head);
            }).then(function (commit) {
                var jobs = uploads.map(function (path) {
                    return gh(token, '/git/blobs', { method: 'POST', body: { content: pending[path], encoding: 'base64' } })
                        .then(function (b) { return { path: path, sha: b.sha }; });
                }).concat(docs.map(function (d) {
                    return gh(token, '/git/blobs', { method: 'POST', body: { content: JSON.stringify(cleaned[d.key], null, 2) + '\n', encoding: 'utf-8' } })
                        .then(function (b) { return { path: d.path, sha: b.sha, key: d.key }; });
                }));
                return Promise.all(jobs).then(function (entries) {
                    var tree = entries.map(function (e) { return { path: e.path, mode: '100644', type: 'blob', sha: e.sha }; });
                    var message = (lines.length === 1 ? lines[0] : 'Update site') + ' (admin page)' +
                        (lines.length > 1 ? '\n\n' + lines.map(function (l) { return '- ' + l; }).join('\n') : '');
                    return gh(token, '/git/trees', { method: 'POST', body: { base_tree: commit.tree.sha, tree: tree } })
                        .then(function (t) { return gh(token, '/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [head] } }); })
                        .then(function (c) {
                            return gh(token, '/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: c.sha, force: false } })
                                .then(function () { return { commit: c.sha, entries: entries }; });
                        });
                });
            }).then(function (res) {
                var b = base.current;
                b.head = res.commit;
                res.entries.forEach(function (e) {
                    b.paths[e.path] = true;
                    if (e.key) { b.blobs[e.key] = e.sha; b.original[e.key] = JSON.stringify(cleaned[e.key]); }
                });
                setPending({});
                setData(Object.assign({}, data, cleaned));
                setStatus({ kind: 'saved', msg: 'Published. Your site shows the change in about a minute.' });
            }).catch(function (err) {
                setStatus({ kind: 'error', msg: errorMessage(err), conflict: err.status === 409 || err.status === 422 });
            });
        }

        if (load.state === 'loading') {
            return h('main', { className: 'wrap admin-msg' }, h('p', null, 'Loading your site from GitHub…'));
        }
        if (load.state === 'error') {
            return h('main', { className: 'wrap admin-msg' },
                h('p', { className: 'form-error', role: 'alert' }, load.msg),
                h('div', { className: 'btn-row' },
                    h('button', { className: 'btn small', onClick: fetchData }, 'Try again'),
                    h('button', { className: 'btn small outline', onClick: props.onLogout }, 'Sign out')));
        }

        var tabs = [['site', 'Page text'], ['experience', 'Experience'], ['projects', 'Projects'], ['apps', 'Apps']];
        var viewHref = tab === 'apps'
            ? '/apps/' + (selApp ? '?app=' + encodeURIComponent(selApp) : '')
            : tab === 'projects' && selProject ? 'index.html?project=' + encodeURIComponent(selProject) + '#projects' : 'index.html#' + (tab === 'site' ? 'top' : tab);

        return h('main', { className: 'wrap admin-main' },
            h('div', { className: 'publish-bar', role: 'region', 'aria-label': 'Publish' },
                h('div', { className: 'publish-state' },
                    status
                        ? h('p', { className: 'status-' + status.kind, role: status.kind === 'error' ? 'alert' : 'status' },
                            status.msg,
                            status.kind === 'saved' && h(React.Fragment, null, ' ', h('a', { href: viewHref }, 'View on site')),
                            status.conflict && h(React.Fragment, null, ' ', h('button', { className: 'link-btn', onClick: fetchData }, 'Reload latest')))
                        : h('p', { className: dirty ? 'status-dirty' : 'status-clean' },
                            dirty
                                ? 'Unpublished changes: ' + DOCS.filter(function (d) { return changed[d.key]; }).map(function (d) { return d.label; }).join(', ') + '.'
                                : 'Everything is published.')
                ),
                h('button', { className: 'btn small', onClick: publish, disabled: !dirty || (status && status.kind === 'saving') },
                    status && status.kind === 'saving' ? 'Publishing…' : 'Publish changes')
            ),
            h('div', { className: 'tabs', role: 'tablist' },
                tabs.map(function (t) {
                    return h('button', {
                        key: t[0], role: 'tab', 'aria-selected': tab === t[0], className: 'tab' + (tab === t[0] ? ' on' : ''),
                        onClick: function () { setTab(t[0]); }
                    }, t[1], changed[t[0]] && h('span', { className: 'dot', 'aria-label': ' (unpublished changes)' }));
                })
            ),
            tab === 'site' && h(SiteForm, { site: data.site, onChange: function (v) { setDoc('site', v); }, upload: upload, preview: preview }),
            tab === 'experience' && h(ListEditor, {
                items: data.experience, selected: selExp, onSelect: setSelExp,
                onItems: function (v) { setDoc('experience', v); },
                addLabel: '+ New entry', deleteLabel: 'Remove this entry',
                titleOf: function (t) { return t.role || 'New role'; },
                subOf: function (t) { return [t.org, t.when].filter(Boolean).join(' / '); },
                onAdd: function () {
                    var n = 1;
                    while (data.experience.some(function (t) { return t.id === 'entry-' + n; })) n++;
                    var t = { id: 'entry-' + n, when: '', role: '', org: '', points: [], tags: [] };
                    setDoc('experience', [t].concat(data.experience));
                    setSelExp(t.id);
                },
                renderForm: function (item, change) { return h(ExperienceForm, { item: item, change: change }); }
            }),
            tab === 'projects' && h(ListEditor, {
                items: data.projects, selected: selProject, onSelect: setSelProject,
                onItems: function (v) { setDoc('projects', v); },
                addLabel: '+ New project', deleteLabel: 'Remove this project',
                titleOf: function (p) { return p.title || 'Untitled project'; },
                subOf: function (p) { return p.type + (p.meta ? ' / ' + p.meta : '') + (p._new ? ' / new' : ''); },
                onAdd: function () {
                    var n = 1;
                    while (data.projects.some(function (p) { return p.id === 'new-project-' + n; })) n++;
                    var p = { id: 'new-project-' + n, type: 'Project', meta: '', title: '', full: '', tags: [], summary: '', body: [''], images: [], links: [], _new: true, _autoId: true };
                    setDoc('projects', [p].concat(data.projects));
                    setSelProject(p.id);
                },
                renderForm: function (item, change) {
                    return h(ProjectForm, { item: item, change: change, upload: upload, preview: preview, isPending: isPending });
                }
            }),
            tab === 'apps' && h(ListEditor, {
                items: data.apps, selected: selApp, onSelect: setSelApp,
                onItems: function (v) { setDoc('apps', v); },
                addLabel: '+ New app', deleteLabel: 'Remove this app',
                titleOf: function (a) { return a.name || 'Untitled app'; },
                subOf: function (a) { return [a.meta, (a.tech || []).slice(0, 2).join(', ')].filter(Boolean).join(' / ') + (a._new ? ' / new' : ''); },
                onAdd: function () {
                    var n = 1;
                    while (data.apps.some(function (a) { return a.id === 'new-app-' + n; })) n++;
                    var a = { id: 'new-app-' + n, name: '', tagline: '', meta: '', tech: [], description: [''], repo: '', download: { label: '', href: '' }, links: [], images: [], _new: true, _autoId: true };
                    setDoc('apps', [a].concat(data.apps));
                    setSelApp(a.id);
                },
                renderForm: function (item, change) {
                    return h(AppForm, { item: item, change: change, upload: upload, preview: preview, isPending: isPending });
                }
            })
        );
    }

    /* ---------- App ---------- */

    function App() {
        var tS = useState(null), token = tS[0], setToken = tS[1];

        function login(t) { setAdminFlag(true); setToken(t); }
        function logout() { setAdminFlag(false); setToken(null); }

        return h(React.Fragment, null,
            h('nav', { className: 'nav' },
                h('div', { className: 'wrap nav-row' },
                    h('a', { className: 'logo', href: 'index.html' }, 'JR', h('span', null, ' / Admin')),
                    h('div', { className: 'admin-nav' },
                        h('a', { href: 'index.html' }, 'View site'),
                        token && h('button', { className: 'link-btn', onClick: logout }, 'Sign out')))),
            token ? h(Editor, { token: token, onLogout: logout }) : h(Login, { onLogin: login })
        );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
