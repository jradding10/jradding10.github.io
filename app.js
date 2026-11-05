(function () {
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useMemo = React.useMemo;
    var useRef = React.useRef;

    // Local paths are stored unencoded in the JSON files; external URLs pass through untouched.
    var asset = function (path) { return /^[a-z]+:/i.test(path) ? path : encodeURI(path); };

    /* ---------- Content (loaded from projects.json and experience.json) ---------- */

    var ITEMS = [];
    var TIMELINE = [];
    var SITE = {};
    var APPS = [];
    var PAGE = document.body.getAttribute('data-page') || 'home';
    var TYPES = ['All'];
    var TYPE_ORDER = ['Project', 'Publication', 'Research'];

    function isAdmin() {
        try { return window.localStorage.getItem('jr-admin') === '1'; } catch (e) { return false; }
    }

    /* ---------- Helpers ---------- */

    function readParam() {
        try { return new URLSearchParams(window.location.search).get('project'); } catch (e) { return null; }
    }

    function writeParam(id) {
        try {
            var url = new URL(window.location.href);
            url.searchParams.set('project', id);
            window.history.replaceState(null, '', url.toString());
        } catch (e) { /* ignore */ }
    }

    function matches(item, q, type) {
        if (type !== 'All' && item.type !== type) return false;
        if (!q) return true;
        var hay = [item.full, item.title, item.type, item.meta, item.summary, item.tags.join(' '), item.body.join(' ')]
            .join(' ').toLowerCase();
        return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) !== -1; });
    }

    /* ---------- Hero waveform (scrolling clock signal) ---------- */

    function Wave() {
        var ref = useRef(null);
        useEffect(function () {
            var canvas = ref.current;
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var raf, t = 0;

            function size() {
                var r = canvas.getBoundingClientRect();
                var dpr = window.devicePixelRatio || 1;
                canvas.width = Math.round(r.width * dpr);
                canvas.height = Math.round(r.height * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            function draw() {
                var w = canvas.clientWidth, hgt = canvas.clientHeight;
                ctx.clearRect(0, 0, w, hgt);
                var half = 36, hi = hgt * 0.22, lo = hgt * 0.78;
                var first = Math.floor(t / half);

                // faint guides at each clock edge
                ctx.strokeStyle = 'rgba(255,255,255,0.10)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (var e = first; e * half - t <= w; e++) {
                    var gx = Math.round(e * half - t) + 0.5;
                    ctx.moveTo(gx, 0);
                    ctx.lineTo(gx, hgt);
                }
                ctx.stroke();

                // clock: high on even half-periods, low on odd, sharp edges
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.lineJoin = 'miter';
                ctx.beginPath();
                for (var k = first; k * half - t <= w + half; k++) {
                    var x0 = k * half - t, x1 = x0 + half;
                    var y = (((k % 2) + 2) % 2 === 0) ? hi : lo;
                    if (k === first) ctx.moveTo(x0, y); else ctx.lineTo(x0, y);
                    ctx.lineTo(x1, y);
                }
                ctx.stroke();
            }

            function frame() {
                t += 0.6;
                draw();
                raf = requestAnimationFrame(frame);
            }

            size();
            draw();
            if (!reduce) raf = requestAnimationFrame(frame);
            window.addEventListener('resize', size);
            return function () {
                if (raf) cancelAnimationFrame(raf);
                window.removeEventListener('resize', size);
            };
        }, []);
        return h('canvas', { ref: ref, className: 'wave', 'aria-hidden': 'true' });
    }

    /* ---------- Components ---------- */

    function Nav() {
        var open = useState(false);
        var isOpen = open[0], setOpen = open[1];
        var home = PAGE === 'home' ? '' : 'index.html';
        var links = [
            ['about', 'About', home + '#about'],
            ['experience', 'Experience', home + '#experience'],
            ['projects', 'Projects', home + '#projects'],
            ['apps', 'Apps', 'apps.html'],
            ['contact', 'Contact', '#contact']
        ];
        return h('nav', { className: 'nav' },
            h('div', { className: 'wrap nav-row' },
                h('a', { className: 'logo', href: home + '#top' }, 'JR', h('span', null, ' / Jacqueline Radding')),
                h('button', {
                    className: 'nav-toggle', 'aria-expanded': isOpen, 'aria-controls': 'nav-links',
                    onClick: function () { setOpen(!isOpen); }
                }, isOpen ? 'Close' : 'Menu'),
                h('ul', { id: 'nav-links', className: 'nav-links' + (isOpen ? ' open' : '') },
                    links.map(function (l) {
                        var here = l[0] === 'apps' && PAGE === 'apps';
                        return h('li', { key: l[0] },
                            h('a', { href: l[2], className: here ? 'here' : undefined, 'aria-current': here ? 'page' : undefined, onClick: function () { setOpen(false); } }, l[1]));
                    })
                )
            )
        );
    }

    function ButtonRow(props) {
        return h('div', { className: 'hero-actions' },
            (props.buttons || []).map(function (b, i) {
                var external = !/^#/.test(b.href) && !/^mailto:/i.test(b.href);
                return h('a', {
                    key: i, className: 'btn' + (i > 0 ? ' ghost' : ''), href: asset(b.href),
                    target: external ? '_blank' : undefined, rel: external ? 'noopener' : undefined
                }, b.label);
            })
        );
    }

    function Hero() {
        var hero = SITE.hero || {};
        var words = String(hero.name || '').split(' ');
        return h('header', { className: 'hero', id: 'top' },
            h('div', { className: 'wrap hero-inner' },
                hero.eyebrow && h('p', { className: 'eyebrow' }, hero.eyebrow),
                h('h1', null, words.map(function (w, i) {
                    return h(React.Fragment, { key: i }, i > 0 && h('br'), w);
                })),
                hero.lede && h('p', { className: 'lede' }, hero.lede),
                h(ButtonRow, { buttons: hero.buttons })
            ),
            h(Wave)
        );
    }

    function About() {
        var about = SITE.about || {};
        return h('section', { id: 'about', className: 'section' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'About')),
                h('div', { className: 'about' + (about.photo ? '' : ' no-photo') },
                    about.photo && h('img', { src: asset(about.photo), alt: about.photoAlt || '', className: 'about-img' }),
                    h('div', null,
                        about.intro && h('p', { className: 'big' }, about.intro),
                        (about.paragraphs || []).map(function (p, i) { return h('p', { key: i }, p); })
                    )
                )
            )
        );
    }

    function Gallery(props) {
        var images = props.images;
        var st = useState(0), idx = st[0], setIdx = st[1];

        useEffect(function () { setIdx(0); }, [props.resetKey]);

        useEffect(function () {
            if (props.noKeys) return undefined;
            function onKey(e) {
                var tag = (document.activeElement && document.activeElement.tagName) || '';
                if (tag === 'INPUT' || tag === 'TEXTAREA') return;
                if (e.key === 'ArrowRight') setIdx(function (i) { return (i + 1) % images.length; });
                if (e.key === 'ArrowLeft') setIdx(function (i) { return (i - 1 + images.length) % images.length; });
            }
            window.addEventListener('keydown', onKey);
            return function () { window.removeEventListener('keydown', onKey); };
        }, [images.length]);

        var cur = images[Math.min(idx, images.length - 1)];
        function go(d) { setIdx((idx + d + images.length) % images.length); }

        return h('div', { className: 'gallery' },
            h('div', { className: 'stage' },
                h('img', { key: cur.src, src: asset(cur.src), alt: cur.alt, className: 'stage-img' }),
                images.length > 1 && h('button', { className: 'arrow prev', 'aria-label': 'Previous image', onClick: function () { go(-1); } }, '‹'),
                images.length > 1 && h('button', { className: 'arrow next', 'aria-label': 'Next image', onClick: function () { go(1); } }, '›')
            ),
            h('div', { className: 'caption' },
                h('span', null, cur.alt),
                h('span', { className: 'count' }, (idx + 1) + ' / ' + images.length)
            ),
            images.length > 1 && h('div', { className: 'thumbs' },
                images.map(function (im, i) {
                    return h('button', {
                        key: im.src, className: 'thumb' + (i === idx ? ' on' : ''),
                        'aria-label': 'Show image ' + (i + 1) + ': ' + im.alt,
                        onClick: function () { setIdx(i); }
                    }, h('img', { src: asset(im.src), alt: '' }));
                })
            )
        );
    }

    function Detail(props) {
        var it = props.item;
        if (!it) {
            return h('div', { className: 'detail empty' }, h('p', null, 'Select a project from the list.'));
        }
        return h('article', { className: 'detail', key: it.id },
            h('div', { className: 'detail-head' },
                h('p', { className: 'kicker' }, it.type + (it.meta ? ' / ' + it.meta : '')),
                h('h3', null, it.full || it.title),
                isAdmin() && h('a', { className: 'edit-link', href: 'admin.html?edit=' + encodeURIComponent(it.id) }, 'Edit project')
            ),
            it.images.length > 0
                ? h(Gallery, { images: it.images, resetKey: it.id })
                : h('div', { className: 'plate', 'aria-hidden': 'true' },
                    h('span', null, it.meta || it.type),
                    h('b', null, it.title)),
            h('div', { className: 'detail-body' },
                it.body.map(function (p, i) { return h('p', { key: i }, p); }),
                h('ul', { className: 'tags' }, it.tags.map(function (t) {
                    return h('li', { key: t }, h('button', { onClick: function () { props.onTag(t); } }, t));
                })),
                it.links.length > 0 && h('div', { className: 'links' },
                    it.links.map(function (l) {
                        return h('a', { key: l.href, href: asset(l.href), target: '_blank', rel: 'noopener' }, l.label + ' ↗');
                    }))
            )
        );
    }

    function Timeline() {
        return h('section', { id: 'experience', className: 'section alt' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'Experience')),
                h('ol', { className: 'timeline' },
                    TIMELINE.map(function (t) {
                        return h('li', { key: t.id, className: 'tl-item' + (t.lead ? ' lead-item' : '') },
                            h('div', { className: 'tl-when' }, t.when),
                            h('div', { className: 'tl-card' },
                                h('p', { className: 'kicker' }, t.org),
                                h('h3', null, t.role),
                                h('ul', { className: 'tl-points' }, t.points.map(function (p, i) { return h('li', { key: i }, p); })),
                                h('ul', { className: 'facts tl-tags' }, t.tags.map(function (g) { return h('li', { key: g }, g); }))
                            )
                        );
                    })
                )
            )
        );
    }

    function Work() {
        var initial = readParam();
        var qS = useState(''), q = qS[0], setQ = qS[1];
        var tS = useState('All'), type = tS[0], setType = tS[1];
        var sS = useState(ITEMS.some(function (i) { return i.id === initial; }) ? initial : (ITEMS[0] ? ITEMS[0].id : null));
        var selected = sS[0], setSelected = sS[1];
        var detailRef = useRef(null);
        var inputRef = useRef(null);

        var results = useMemo(function () {
            return ITEMS.filter(function (i) { return matches(i, q, type); });
        }, [q, type]);

        var item = ITEMS.filter(function (i) { return i.id === selected; })[0];
        var visible = results.some(function (r) { return r.id === selected; });

        useEffect(function () { if (selected) writeParam(selected); }, [selected]);

        useEffect(function () {
            function onKey(e) {
                var tag = (document.activeElement && document.activeElement.tagName) || '';
                if (e.key === '/' && tag !== 'INPUT') {
                    e.preventDefault();
                    if (inputRef.current) inputRef.current.focus();
                }
            }
            window.addEventListener('keydown', onKey);
            return function () { window.removeEventListener('keydown', onKey); };
        }, []);

        function choose(id) {
            setSelected(id);
            if (window.matchMedia && window.matchMedia('(max-width: 900px)').matches && detailRef.current) {
                var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                detailRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
            }
        }

        return h('section', { id: 'projects', className: 'section' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'Projects')),
                h('div', { className: 'work' },
                    h('aside', { className: 'index' },
                        h('div', { className: 'search' },
                            h('label', { htmlFor: 'work-search', className: 'sr' }, 'Search projects'),
                            h('input', {
                                id: 'work-search', ref: inputRef, type: 'search', value: q, autoComplete: 'off',
                                placeholder: 'Search projects, tools, tags', onChange: function (e) { setQ(e.target.value); }
                            }),
                            h('kbd', { 'aria-hidden': 'true' }, '/')
                        ),
                        h('div', { className: 'chips', role: 'group', 'aria-label': 'Filter by type' },
                            TYPES.map(function (t) {
                                return h('button', {
                                    key: t, className: 'chip' + (type === t ? ' on' : ''), 'aria-pressed': type === t,
                                    onClick: function () { setType(t); }
                                }, t);
                            })
                        ),
                        h('p', { className: 'status', role: 'status' },
                            results.length + (results.length === 1 ? ' result' : ' results') +
                            (q || type !== 'All' ? '' : ' of ' + ITEMS.length)),
                        results.length === 0
                            ? h('div', { className: 'none' },
                                h('p', null, 'Nothing matches “' + q + '”.'),
                                h('button', { className: 'btn small', onClick: function () { setQ(''); setType('All'); } }, 'Clear filters'))
                            : h('ol', { className: 'list' },
                                results.map(function (r, n) {
                                    var on = r.id === selected;
                                    return h('li', { key: r.id },
                                        h('button', {
                                            className: 'row' + (on ? ' on' : ''), 'aria-current': on ? 'true' : undefined,
                                            onClick: function () { choose(r.id); }
                                        },
                                            h('span', { className: 'idx' }, String(ITEMS.indexOf(r) + 1).padStart(2, '0')),
                                            h('span', { className: 'txt' },
                                                h('strong', null, r.title),
                                                h('small', null, r.type + (r.meta ? ' / ' + r.meta : '')),
                                                h('span', { className: 'sum' }, r.summary)),
                                            h('span', { className: 'go', 'aria-hidden': 'true' }, '→')
                                        )
                                    );
                                })
                            )
                    ),
                    h('div', { className: 'pane', ref: detailRef },
                        h(Detail, {
                            item: item,
                            onTag: function (t) { setType('All'); setQ(t); }
                        }),
                        !visible && results.length > 0 && h('p', { className: 'hint' }, 'The open project is hidden by your current filter.')
                    )
                )
            )
        );
    }

    function LinkedIn() {
        var li = SITE.linkedin || {};
        if (li.show === false || !li.url) return null;
        return h('section', { id: 'linkedin', className: 'section alt linkedin-band' },
            h('div', { className: 'wrap linkedin-row' },
                h('div', { className: 'linkedin-text' },
                    h('p', { className: 'kicker' }, 'LinkedIn'),
                    li.heading && h('h2', { className: 'linkedin-heading' }, li.heading),
                    li.lead && h('p', { className: 'lead' }, li.lead)),
                h('a', { className: 'btn small', href: li.url, target: '_blank', rel: 'noopener' }, (li.label || 'Connect on LinkedIn') + ' ↗')
            )
        );
    }

    /* ---------- Apps page ---------- */

    function AppsHeader() {
        return h('header', { className: 'hero hero-sm', id: 'top' },
            h('div', { className: 'wrap hero-inner' },
                h('p', { className: 'eyebrow' }, 'Apps & code'),
                h('h1', null, 'Apps'),
                h('p', { className: 'lede' }, 'Programming projects with their source code. Browse them, download them and try them yourself.')
            ),
            h(Wave)
        );
    }

    function AppCard(props) {
        var a = props.app;
        var open = props.open;
        var links = [];
        if (a.repo) links.push(h('a', { key: 'repo', className: 'btn small', href: a.repo, target: '_blank', rel: 'noopener' }, 'View on GitHub ↗'));
        if (a.download && a.download.href) {
            var local = !/^[a-z]+:/i.test(a.download.href);
            links.push(h('a', {
                key: 'dl', className: 'btn small outline', href: asset(a.download.href),
                download: local ? '' : undefined, rel: 'noopener'
            }, '↓ ' + (a.download.label || 'Download')));
        }
        return h('article', { className: 'app-card' + (open ? ' open' : ''), id: 'app-' + a.id },
            a.images && a.images.length > 0
                ? h('img', { className: 'app-cover', src: asset(a.images[0].src), alt: a.images[0].alt || '' })
                : h('div', { className: 'app-cover plate', 'aria-hidden': 'true' }, h('span', null, a.meta || 'App'), h('b', null, a.name)),
            h('div', { className: 'app-body' },
                a.meta && h('p', { className: 'kicker' }, a.meta),
                h('h2', null, a.name),
                h('p', { className: 'app-tagline' }, a.tagline),
                a.tech && a.tech.length > 0 && h('ul', { className: 'tags' }, a.tech.map(function (t) {
                    return h('li', { key: t }, h('button', { onClick: function () { props.onTag(t); } }, t));
                })),
                h('div', { className: 'app-actions' }, links,
                    h('button', { className: 'link-btn', 'aria-expanded': open, 'aria-controls': 'app-more-' + a.id, onClick: props.onToggle },
                        open ? 'Hide details' : 'Details'),
                    isAdmin() && h('a', { className: 'edit-link', href: 'admin.html?tab=apps&edit=' + encodeURIComponent(a.id) }, 'Edit')),
                open && h('div', { className: 'app-more', id: 'app-more-' + a.id },
                    (a.description || []).map(function (p, i) { return h('p', { key: i }, p); }),
                    a.links && a.links.length > 0 && h('div', { className: 'links' }, a.links.map(function (l) {
                        return h('a', { key: l.href, href: asset(l.href), target: '_blank', rel: 'noopener' }, l.label + ' ↗');
                    })),
                    a.images && a.images.length > 0 && h(Gallery, { images: a.images, resetKey: a.id, noKeys: true })
                )
            )
        );
    }

    function Apps() {
        var initial = null;
        try { initial = new URLSearchParams(window.location.search).get('app'); } catch (e) { /* ignore */ }
        var qS = useState(''), q = qS[0], setQ = qS[1];
        var oS = useState(initial), openId = oS[0], setOpenId = oS[1];

        useEffect(function () {
            if (!initial) return;
            var el = document.getElementById('app-' + initial);
            if (el) el.scrollIntoView({ block: 'start' });
        }, []);

        var words = q.toLowerCase().split(/\s+/).filter(Boolean);
        var results = APPS.filter(function (a) {
            var hay = [a.name, a.tagline, a.meta, (a.tech || []).join(' '), (a.description || []).join(' ')].join(' ').toLowerCase();
            return words.every(function (w) { return hay.indexOf(w) !== -1; });
        });

        return h('section', { id: 'apps', className: 'section' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'All apps')),
                APPS.length > 1 && h('div', { className: 'search apps-search' },
                    h('label', { htmlFor: 'apps-search', className: 'sr' }, 'Search apps'),
                    h('input', { id: 'apps-search', type: 'search', value: q, autoComplete: 'off', placeholder: 'Search by name or language', onChange: function (e) { setQ(e.target.value); } })),
                APPS.length === 0
                    ? h('p', { className: 'lead' }, 'Apps are on the way. Check back soon.')
                    : results.length === 0
                        ? h('div', { className: 'none' },
                            h('p', null, 'Nothing matches “' + q + '”.'),
                            h('button', { className: 'btn small', onClick: function () { setQ(''); } }, 'Clear search'))
                        : h('div', { className: 'app-grid' }, results.map(function (a) {
                            return h(AppCard, {
                                key: a.id, app: a, open: openId === a.id,
                                onToggle: function () { setOpenId(openId === a.id ? null : a.id); },
                                onTag: function (t) { setQ(t); }
                            });
                        }))
            )
        );
    }

    function Contact() {
        var contact = SITE.contact || {};
        return h('section', { id: 'contact', className: 'section contact' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'Contact')),
                contact.heading && h('p', { className: 'huge' }, contact.heading),
                contact.lead && h('p', { className: 'lead' }, contact.lead),
                h(ButtonRow, { buttons: contact.buttons })
            )
        );
    }

    function Footer() {
        var li = SITE.linkedin || {};
        return h('footer', { className: 'foot' }, h('div', { className: 'wrap foot-row' },
            h('span', null, SITE.footer || ''),
            h('span', { className: 'foot-links' },
                li.url && h('a', { href: li.url, target: '_blank', rel: 'noopener' }, 'LinkedIn'),
                h('a', { href: 'https://github.com/jradding10', target: '_blank', rel: 'noopener' }, 'GitHub'),
                isAdmin() && h('a', { href: 'admin.html' }, 'Admin'))));
    }

    function App() {
        if (PAGE === 'apps') {
            return h(React.Fragment, null, h(Nav), h(AppsHeader), h(Apps), h(Contact), h(Footer));
        }
        return h(React.Fragment, null,
            h(Nav), h(Hero), h(About), h(Timeline), h(Work), h(LinkedIn), h(Contact), h(Footer));
    }

    function loadJSON(path) {
        return fetch(path, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error(path + ' returned ' + r.status);
            return r.json();
        });
    }

    var root = ReactDOM.createRoot(document.getElementById('root'));

    var files = PAGE === 'apps' ? ['site.json', 'apps.json'] : ['site.json', 'projects.json', 'experience.json'];

    Promise.all(files.map(loadJSON))
        .then(function (data) {
            SITE = data[0];
            if (PAGE === 'apps') {
                APPS = data[1];
            } else {
                ITEMS = data[1];
                TIMELINE = data[2];
                var present = ITEMS.map(function (i) { return i.type; });
                TYPES = ['All'].concat(TYPE_ORDER.filter(function (t) { return present.indexOf(t) !== -1; }),
                    present.filter(function (t, n) { return TYPE_ORDER.indexOf(t) === -1 && present.indexOf(t) === n; }));
            }
            root.render(h(App));
        })
        .catch(function () {
            root.render(h('p', { className: 'load-error' },
                'This page could not load. Please refresh, or email jgraddin@calpoly.edu.'));
        });
})();
