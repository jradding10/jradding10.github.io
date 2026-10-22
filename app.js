(function () {
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useMemo = React.useMemo;
    var useRef = React.useRef;

    var img = function (path) { return encodeURI(path); };

    /* ---------- Content ---------- */

    var ITEMS = [
        {
            id: 'sdr-images',
            type: 'Project',
            meta: 'EE 504',
            title: 'Images Over SDRs',
            full: 'Transmitting Images Over SDRs With GNU Radio and Simulink',
            tags: ['SDR', 'GNU Radio', 'Simulink', 'Modulation'],
            summary: 'Raspberry Pi SDRs sending an image over air with BPSK, QPSK and 16QAM.',
            body: [
                'Used Raspberry Pi SDRs to compare different modulation schemes (BPSK, QPSK, 16QAM) to find the maximum distance they could send an image to another SDR using GNU Radio and Simulink.',
                'The first image shows an image sent over air to another SDR using BPSK. The second shows the same using 16QAM, which does not perform well because of its smaller decision boundaries. The third and fourth images are the code flow diagrams of the receiver and transmitter.'
            ],
            images: [
                { src: img('images/gnuproj/BPSK_SNR12.JPG'), alt: 'BPSK image transmission result' },
                { src: img('images/gnuproj/64QAM_SNR16.JPG'), alt: '16QAM image transmission result' },
                { src: img('images/gnuproj/recieve_flow.JPG'), alt: 'Receiver flow diagram' },
                { src: img('images/gnuproj/transmit_flow.JPG'), alt: 'Transmitter flow diagram' }
            ],
            links: [
                { label: 'Lab Notebook (PDF)', href: img('pdfs/EE 504 Software Defined Radio Lab Notebook (9).pdf') },
                { label: 'SDR Modulation Final Report (PDF)', href: img('pdfs/EE 504 Software Defined Radio Final Project (1).pdf') }
            ]
        },
        {
            id: 'lpf-10mhz',
            type: 'Project',
            meta: 'EE 425',
            title: '10 MHz Low Pass Filter',
            full: '10 MHz Low Pass Filter Simulation',
            tags: ['RF', 'PCB', 'Keysight ADS', 'VNA'],
            summary: 'Designed in Keysight ADS, built on an OSH Park PCB and measured on a VNA.',
            body: [
                'A 10 MHz low pass filter built in Keysight ADS. The filter was ordered on OSH Park PCB and had its S-parameter magnitude and phase tested on a VNA. Impedance was also tested.',
                'Use the arrows to move through the simulation and results images.'
            ],
            images: [
                { src: img('images/keysight1.PNG'), alt: 'Filter layout' },
                { src: img('images/copper.png'), alt: 'Copper layer' },
                { src: img('images/keysight2.PNG'), alt: 'Schematic design' },
                { src: img('images/keysight3.PNG'), alt: 'PCB' },
                { src: img('images/keysight4.PNG'), alt: 'S-parameter magnitude of ordered PCB' },
                { src: img('images/keysight5.PNG'), alt: 'S-parameter phase' },
                { src: img('images/keysight6.PNG'), alt: 'Impedance Smith chart' }
            ],
            links: [{ label: 'Full Project Details (PDF)', href: img('pdfs/EE425_LPF_DATA.pdf') }]
        },
        {
            id: 'costas-loop',
            type: 'Project',
            meta: 'Simulink',
            title: 'Costas Loop BPSK Receiver',
            full: 'Simulink Costas Loop BPSK',
            tags: ['Simulink', 'Digital comms', 'BPSK', 'Synchronization'],
            summary: 'A receiver that locks onto a 200 kHz carrier and demodulates 10 kbps BPSK.',
            body: [
                'A receiver was designed to synchronize and demodulate 10 kbps data modulated using BPSK with a nominal 200 kHz carrier. The transmitter consistently begins with a pilot signal consisting of ten consecutive ‘1’ bits, followed by the data stream.',
                'The first image shows a test harness with configurable parameters, allowing adjustments to phase, frequency, and angle drift. The second illustrates a Costas loop, implemented to correct frequency bias and phase offset. The Costas loop locks onto the signal’s center frequency, downconverting it to baseband by generating a local, in-phase replica of the carrier, multiplying it with the received signal, and then filtering the result through a low-pass filter.',
                'The third image depicts a voltage-controlled oscillator (VCO) that generates a local carrier signal aligned with the phase of the received signal. The fourth shows a sample-and-hold system designed to detect the pilot signal, triggering the receiver to process the incoming data once the pilot is successfully identified.'
            ],
            images: [
                { src: img('images/Testharness.PNG'), alt: 'Test harness' },
                { src: img('images/lecostasloop/lecostas.PNG'), alt: 'Costas loop' },
                { src: img('images/VCO.PNG'), alt: 'Voltage controlled oscillator' },
                { src: img('images/lecostasloop/sampleandhold system.PNG'), alt: 'Sample and hold system' }
            ],
            links: []
        },
        {
            id: 'asee-paper',
            type: 'Publication',
            meta: '2024',
            title: 'Industrial Power and Control Lab',
            full: 'Development of a Laboratory Course in Industrial Power and Control',
            tags: ['PLC', 'Education', 'ASEE'],
            summary: 'Published at ASEE PSW Conference 2024, Las Vegas, NV.',
            body: [
                'Publication: ASEE PSW Conference 2024, Las Vegas, NV.',
                'This paper discusses the design and implementation of an industrial power and control PLC lab for Electrical Engineers.'
            ],
            images: [],
            links: [{ label: 'Read the paper (ASEE)', href: 'https://peer.asee.org/development-of-a-laboratory-course-in-industrial-power-and-control-for-electrical-engineers' }]
        },
        {
            id: 'thesis',
            type: 'Research',
            meta: '2024 / 2025',
            title: 'Master Thesis: Connected Vehicles',
            full: 'Master Thesis: Connected Autonomous Vehicles',
            tags: ['Machine learning', 'V2V', 'Digital comms'],
            summary: 'Machine learning to optimize V2V communication systems.',
            body: ['Using machine learning to optimize V2V digital communication systems.'],
            images: [],
            links: [
                { label: 'Read the thesis (Cal Poly Digital Commons)', href: 'https://digitalcommons.calpoly.edu/theses/3115/' },
                { label: 'View the thesis slides (Google Slides)', href: 'https://docs.google.com/presentation/d/12b5lJT-Eydzdcb8EUwnsdM3ceCfxGHsL/edit?usp=sharing&ouid=115642118826029580243&rtpof=true&sd=true' }
            ]
        },
    ];


    var TIMELINE = [
        {
            id: 'cisco',
            when: 'Aug 2025 \u2013 Present',
            role: 'Product Engineer',
            org: 'Cisco',
            lead: true,
            points: [
                'Work on hyperscaler network switches, taking hardware from design through to volume manufacturing.',
                'Apply design for manufacturability (DFM) so boards and systems can be built reliably and at scale.',
                'Focus on lowering cost while holding quality and supply chain resilience, so we deliver every time.'
            ],
            tags: ['Hyperscalers', 'Network switches', 'Manufacturing engineering', 'DFM', 'Supply chain']
        },
        {
            id: 'calpoly',
            when: '2025',
            role: 'M.S. Electrical Engineering',
            org: 'Cal Poly San Luis Obispo',
            points: ['Specialized in digital communications and machine learning. President of Cal Poly IEEE and a Resident Advisor, mentoring fellow students.'],
            tags: ['Digital communications', 'Machine learning', 'Leadership']
        },
        {
            id: 'ti',
            when: '2024',
            role: 'Internship',
            org: 'Texas Instruments',
            points: ['Built an automated voltage spike checker. Designed and automated PCB tests, reducing manual labor by 50% and improving program efficiency.'],
            tags: ['PCB', 'Test automation']
        },
        {
            id: 'hpe',
            when: '2023',
            role: 'FCC Compliance Simulation Internship',
            org: 'Hewlett Packard Enterprise',
            points: ['Simulated radiated emissions and implemented solutions to achieve FCC compliance in hybrid cloud products.'],
            tags: ['EMC', 'Simulation', 'FCC']
        }
    ];

    var TYPES = ['All', 'Project', 'Publication', 'Research'];

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
        var links = [['about', 'About'], ['experience', 'Experience'], ['projects', 'Projects'], ['blog', 'Blog'], ['contact', 'Contact']];
        return h('nav', { className: 'nav' },
            h('div', { className: 'wrap nav-row' },
                h('a', { className: 'logo', href: '#top' }, 'JR', h('span', null, ' / Jacqueline Radding')),
                h('button', {
                    className: 'nav-toggle', 'aria-expanded': isOpen, 'aria-controls': 'nav-links',
                    onClick: function () { setOpen(!isOpen); }
                }, isOpen ? 'Close' : 'Menu'),
                h('ul', { id: 'nav-links', className: 'nav-links' + (isOpen ? ' open' : '') },
                    links.map(function (l) {
                        return h('li', { key: l[0] },
                            h('a', { href: '#' + l[0], onClick: function () { setOpen(false); } }, l[1]));
                    })
                )
            )
        );
    }

    function Hero() {
        return h('header', { className: 'hero', id: 'top' },
            h('div', { className: 'wrap hero-inner' },
                h('p', { className: 'eyebrow' }, 'Hardware Engineer / M.S. Cal Poly SLO 2025'),
                h('h1', null, 'Jacqueline', h('br'), 'Radding'),
                h('p', { className: 'lede' }, 'Quality comes first. I build hardware that is made right, ships on time and holds up in the field.'),
                h('div', { className: 'hero-actions' },
                    h('a', { className: 'btn', href: '#projects' }, 'Browse projects'),
                    h('a', { className: 'btn ghost', href: 'resume_radding_2023.pdf', target: '_blank', rel: 'noopener' }, 'Resume')
                )
            ),
            h(Wave)
        );
    }

    function About() {
        return h('section', { id: 'about', className: 'section' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'About')),
                h('div', { className: 'about' },
                    h('img', { src: 'images/aboutmep.jpg', alt: 'Jacqueline Radding', className: 'about-img' }),
                    h('div', null,
                        h('p', { className: 'big' }, 'It\u2019s nice to meet you. My name is Jacqueline, and I\u2019m a hardware engineer.'),
                        h('p', null, 'At Cisco, I work on hyperscaler network switches, applying design for manufacturability (DFM) to get hardware built reliably at scale. My focus is lowering cost while maintaining quality and supply chain resilience, so we deliver every time.'),
                        h('p', null, 'I graduated from Cal Poly San Luis Obispo with a master\u2019s in electrical engineering in 2025. At Cal Poly, I served as the President of Cal Poly IEEE and worked as a Resident Advisor, mentoring fellow students. I specialized in digital communications and machine learning.')
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
                h('img', { key: cur.src, src: cur.src, alt: cur.alt, className: 'stage-img' }),
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
                    }, h('img', { src: im.src, alt: '' }));
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
                h('h3', null, it.full)
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
                        return h('a', { key: l.href, href: l.href, target: '_blank', rel: 'noopener' }, l.label + ' ↗');
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
        var sS = useState(ITEMS.some(function (i) { return i.id === initial; }) ? initial : ITEMS[0].id);
        var selected = sS[0], setSelected = sS[1];
        var detailRef = useRef(null);
        var inputRef = useRef(null);

        var results = useMemo(function () {
            return ITEMS.filter(function (i) { return matches(i, q, type); });
        }, [q, type]);

        var item = ITEMS.filter(function (i) { return i.id === selected; })[0];
        var visible = results.some(function (r) { return r.id === selected; });

        useEffect(function () { writeParam(selected); }, [selected]);

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

    function Blog() {
        return h('section', { id: 'blog', className: 'section alt' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'Blog')),
                h('p', { className: 'lead' }, 'Check out my latest posts and updates:'),
                h('iframe', {
                    src: 'https://widgets.sociablekit.com/linkedin-profile-posts/iframe/25577547',
                    title: 'LinkedIn posts', width: '100%', height: '1000', frameBorder: '0'
                })
            )
        );
    }

    function Contact() {
        return h('section', { id: 'contact', className: 'section contact' },
            h('div', { className: 'wrap' },
                h('h2', { className: 'section-title' }, h('span', null, 'Contact')),
                h('p', { className: 'huge' }, 'Let’s build something.'),
                h('p', { className: 'lead' }, 'Reach out for collaborations, questions, or networking.'),
                h('div', { className: 'hero-actions' },
                    h('a', { className: 'btn', href: 'mailto:jgraddin@calpoly.edu' }, 'jgraddin@calpoly.edu'),
                    h('a', { className: 'btn ghost', href: 'https://portfolium.com/JacquelineRadd', target: '_blank', rel: 'noopener' }, 'Portfolium'),
                    h('a', { className: 'btn ghost', href: 'resume_radding_2023.pdf', target: '_blank', rel: 'noopener' }, 'Resume (PDF)')
                )
            )
        );
    }

    function App() {
        return h(React.Fragment, null,
            h(Nav), h(Hero), h(About), h(Timeline), h(Work), h(Blog), h(Contact),
            h('footer', { className: 'foot' }, h('div', { className: 'wrap' }, '© 2025 Jacqueline Radding'))
        );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(h(App));
})();
