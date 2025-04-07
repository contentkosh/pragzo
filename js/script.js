document.addEventListener('DOMContentLoaded', function() {

    // Set current year in footer
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Smooth Scrolling & Active Nav Link Highlighting ---
    const mainNavLinks = document.querySelectorAll('header nav > ul > li > a.nav-link');
    const header = document.querySelector('header');
    let headerHeight = header ? header.offsetHeight : 0;

    // Recalculate header height on resize and load
    function updateHeaderHeight() {
         headerHeight = header ? header.offsetHeight : 0;
    }
    window.addEventListener('resize', updateHeaderHeight);
    setTimeout(updateHeaderHeight, 100); // Initial check after potential layout shifts

    // Function for smooth scrolling
    function smoothScrollTo(targetId) {
        updateHeaderHeight(); // Re-check header height before scroll
        if (targetId && typeof targetId === 'string' && targetId.startsWith('#')) {
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerHeight - 10; // Added small buffer
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                } else {
                    console.warn(`Smooth scroll target not found: ${targetId}`);
                }
            } catch (e) {
                 console.error(`Error finding smooth scroll target ${targetId}:`, e);
            }
        }
    }

    // Global variable for current page filename
    let currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Add click listeners for main nav links
    mainNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetHref = this.getAttribute('href');
            const targetPath = targetHref.split('#')[0] || currentPage; // Page the link points to
            const targetSectionId = targetHref.includes('#') ? '#' + targetHref.split('#')[1] : null;

            // Check if linking to a section on the CURRENT page
            if (targetPath === currentPage && targetSectionId) {
                e.preventDefault();
                smoothScrollTo(targetSectionId);
                 // Close mobile dropdown if open
                 const dropdownMenu = document.querySelector('.dropdown-menu');
                 if(dropdownMenu && dropdownMenu.classList.contains('open')){
                    dropdownMenu.classList.remove('open');
                    document.querySelector('.dropdown > a[aria-haspopup="true"]')?.setAttribute('aria-expanded', 'false');
                 }
            }
            // Let browser handle navigation for links to other pages
        });
    });

    const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
    dropdownLinks.forEach(link => {
         link.addEventListener('click', function(e) {
             const targetHref = this.getAttribute('href');
             // Allow navigation to subject-template.html? etc.
             if (targetHref && targetHref.startsWith('#') && !targetHref.includes('.html')) {
                 // This case is unlikely with current setup but kept for safety
                 e.preventDefault();
                 smoothScrollTo(targetHref);
                 const parentDropdown = this.closest('.dropdown-menu');
                 if (parentDropdown && parentDropdown.classList.contains('open')) {
                    parentDropdown.classList.remove('open');
                    document.querySelector('.dropdown > a[aria-haspopup="true"]')?.setAttribute('aria-expanded', 'false');
                 }
             }
              // Close dropdown even when navigating away
              const parentDropdown = this.closest('.dropdown-menu');
              if (parentDropdown && parentDropdown.classList.contains('open')) {
                 parentDropdown.classList.remove('open');
                 document.querySelector('.dropdown > a[aria-haspopup="true"]')?.setAttribute('aria-expanded', 'false');
              }
         });
    });

    function debounce(func, wait = 15, immediate = false) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() { timeout = null; if (!immediate) func.apply(context, args); };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    const updateActiveLink = debounce(() => {
        let currentSectionId = '';
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.pageYOffset;

         let firstSectionTop = Infinity;
         if (sections.length > 0) {
             try {
                 const firstVisibleSection = Array.from(sections).find(s => s.offsetTop >= 0); // Find first section potentially in view
                 if (firstVisibleSection) {
                     firstSectionTop = firstVisibleSection.offsetTop - headerHeight - 50;
                 } else { firstSectionTop = 200; }
             } catch (e) { console.error("Error getting first section offsetTop", e); firstSectionTop = 200; }
        }

        sections.forEach(section => {
             try {
                 if (section.offsetHeight > 0) {
                    const sectionTop = section.offsetTop - headerHeight - 50;
                    // Check if section top is above current scroll position
                    // And if section bottom is below current scroll position (or close to it)
                    const sectionBottom = sectionTop + section.offsetHeight;
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom ) {
                        currentSectionId = section.getAttribute('id');
                    }
                 }
             } catch(e) { console.error("Error getting section offsetTop for", section.id, e)}
        });

        // If no section is actively in view but we've scrolled past the top threshold,
        // keep the last active section ID or clear it if scrolled back up.
        if (!currentSectionId && scrollPosition >= (firstSectionTop - 50) ) { // Scrolled down a bit
            // Keep the last section ID if available from previous checks (might need state)
            // For simplicity, let's prioritize the top section if nothing else matches precisely
            if (sections.length > 0) currentSectionId = sections[0].id;
        }


        // If scrolled near the top on index page, set hero as active section
        if (currentPage === 'index.html' && scrollPosition < (firstSectionTop > 100 ? firstSectionTop : 100)) { // Check if near top
            currentSectionId = 'hero';
        } else if (currentPage !== 'index.html' && scrollPosition < 100) {
             // On other pages, if scrolled to top, no section ID is active
             currentSectionId = '';
        }


        mainNavLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            let isActive = false;
            const linkTargetPage = linkHref.split('#')[0] || 'index.html';
            const linkTargetSection = linkHref.includes('#') ? linkHref.split('#')[1] : null;

            // Match page filename
            if (linkTargetPage === currentPage) {
                 // If it targets a specific section, check if that section is active
                 if (linkTargetSection) {
                     if (linkTargetSection === currentSectionId) {
                         isActive = true;
                     }
                 } else {
                     // If it *doesn't* target a section (e.g., about.html), activate if no specific section is active
                     if (currentSectionId === '' || (currentPage === 'index.html' && currentSectionId === 'hero')) {
                          // Special case for 'Home' link on index page
                          if (linkHref === 'index.html#hero' && currentSectionId === 'hero') {
                              isActive = true;
                          } else if (linkHref !== 'index.html#hero') {
                              // Activate About, Contact etc. if we are on that page and scrolled to top
                                isActive = true;
                          }
                     }
                 }
            }


            if (isActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }

        });

    }, 50);

    window.addEventListener('scroll', updateActiveLink);

    // --- Handle Hash on Page Load for Smooth Scroll ---
    const hash = window.location.hash;
    if (hash && document.querySelector(hash)) {
         setTimeout(() => {
             console.log(`Hash detected on load: ${hash}. Scrolling...`);
             smoothScrollTo(hash);
             setTimeout(updateActiveLink, 200); // Update active link after scroll animation might finish
         }, 150);
    } else {
         updateActiveLink(); // Run immediately if no hash
    }


    // --- Mobile Dropdown Toggle ---
    const dropdownToggle = document.querySelector('.dropdown > a');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            const isOpening = !dropdownMenu.classList.contains('open');
            dropdownMenu.classList.toggle('open');
            this.setAttribute('aria-expanded', isOpening);
        });

        document.addEventListener('click', function(e) {
            if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
                if (dropdownMenu.classList.contains('open')) {
                    dropdownMenu.classList.remove('open');
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });

         window.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                 if (dropdownMenu.classList.contains('open')) {
                    dropdownMenu.classList.remove('open');
                     dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }


    // --- Modal Open/Close Logic ---
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const modalCloses = document.querySelectorAll('.modal-close');
    let currentPdfUrl = null;

    modalTriggers.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-id');
            const pdfUrl = this.getAttribute('data-pdf-url');
            const targetModal = document.getElementById(modalId);

            if (targetModal && pdfUrl) {
                currentPdfUrl = pdfUrl;
                targetModal.classList.add('active');
                document.body.classList.add('modal-open');

                const resourceInput = targetModal.querySelector('input[name="resource_id"]');
                 if (resourceInput) {
                    let resourceName = modalId.replace('-modal', '').replace('subject-', '');
                    resourceInput.value = resourceName || 'unknown';
                 }
                const firstInput = targetModal.querySelector('form input:not([type=hidden])');
                if(firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }

            } else {
                console.error('Modal container or PDF URL not found for:', modalId, pdfUrl);
                alert('Sorry, the download link is currently unavailable.');
            }
        });
    });

    modalCloses.forEach(close => {
        close.addEventListener('click', function(e) {
            if (e.target === this) {
                const activeModal = document.querySelector('.modal-container.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                    document.body.classList.remove('modal-open');
                    currentPdfUrl = null;
                     const form = activeModal.querySelector('form');
                     if (form) form.reset();
                     activeModal.querySelectorAll('input').forEach(input => input.style.borderColor = '#ccc');
                }
            }
        });
    });

     window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
             const activeModal = document.querySelector('.modal-container.active');
             if (activeModal) {
                 activeModal.classList.remove('active');
                 document.body.classList.remove('modal-open');
                 currentPdfUrl = null;
                 const form = activeModal.querySelector('form');
                 if (form) form.reset();
                 activeModal.querySelectorAll('input').forEach(input => input.style.borderColor = '#ccc');
             }
        }
    });


    // --- Modal Form Submission Logic ---
    const modalDownloadForms = document.querySelectorAll('.modal-download-form');

    modalDownloadForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();

            const modalContainer = this.closest('.modal-container');
            const pdfUrl = currentPdfUrl;

            let isValid = true;
            // Reset borders first
            this.querySelectorAll('input').forEach(input => input.style.borderColor = '#ccc');

            const requiredInputs = this.querySelectorAll('input[required]');
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'red';
                }
            });

            const emailInput = this.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim() && !/.+@.+\..+/.test(emailInput.value)) {
                 isValid = false;
                 emailInput.style.borderColor = 'red';
                 if (isValid) alert('Please enter a valid email address.'); // Alert only if other fields were valid
            }

            const phoneInput = this.querySelector('input[type="tel"]');
            if (phoneInput && phoneInput.value.trim() && !/^[6-9]\d{9}$/.test(phoneInput.value.trim())) {
                 isValid = false;
                 phoneInput.style.borderColor = 'red';
                 if (isValid) alert('Please enter a valid 10-digit Indian mobile number (starting 6-9).');
            }

            if (isValid && pdfUrl && !pdfUrl.includes('_ID_HERE') && pdfUrl !== '#') {
                const formData = new FormData(this);
                const name = formData.get('name');
                const email = formData.get('email');
                const phone = formData.get('phone');
                const resourceId = formData.get('resource_id') || 'unknown_resource';

                console.log(`Form Data Collected for ${resourceId}: Name=${name}, Email=${email}, Phone=${phone || 'N/A'}`);

                // --- Simulation Only ---
                alert('Thank you!\n(Data logged to console for demo.)\nOpening PDF in new tab...');
                window.open(pdfUrl, '_blank');

                this.reset();
                modalContainer.classList.remove('active');
                document.body.classList.remove('modal-open');
                currentPdfUrl = null;

            } else if (!isValid) {
                 // Avoid multiple alerts
                 if((!emailInput || emailInput.style.borderColor !== 'red') && (!phoneInput || phoneInput.style.borderColor !== 'red')) {
                    alert('Please fill in all required fields correctly.');
                 }
            } else {
                 alert('Download link is not available yet. Please check back later or contact support.');
                 console.error('Invalid or missing PDF URL for modal:', modalContainer.id, pdfUrl);
                 modalContainer.classList.remove('active');
                 document.body.classList.remove('modal-open');
                 currentPdfUrl = null;
            }
        });
    });


    // --- Dynamic Subject Page Logic (Integrated) ---
    if (document.getElementById('subject-content')) {
         const params = new URLSearchParams(window.location.search);
         let subject = params.get('subject');
         let subjectKey = subject || 'Default';

         const subjectDisplayNames = {
                'Physics': 'Physics', 'Chemistry': 'Chemistry', 'Biology': 'Biology', 'Maths': 'Mathematics',
                'Accountancy': 'Accountancy', 'Economics': 'Economics', 'BusinessStudies': 'Business Studies',
                'History': 'History', 'Geography': 'Geography', 'PoliticalScience': 'Political Science',
                'Psychology': 'Psychology', 'English': 'English', 'Hindi': 'Hindi', 'GeneralTest': 'General Test',
         };

         let subjectName = 'CUET Subject';
         if (subject && subjectDisplayNames[subject]) {
             subjectName = subjectDisplayNames[subject];
         } else if (subject) {
              subjectName = subject.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
         } else {
             subjectName = 'CUET Resources Overview';
             subjectKey = null;
         }

         const linkSubject = document.getElementById('subject-link');
         if(linkSubject) linkSubject.href = `/pyq/${subjectName}.pdf`;


         document.title = `${subjectName} Resources - PragZo`;
         const titleElement = document.getElementById('subject-title');
         const subtitleElement = document.getElementById('subject-subtitle');
         if(titleElement) titleElement.textContent = `${subjectName} Resources`;
         if(subtitleElement) subtitleElement.textContent = `Detailed Information for ${subjectName}`;
         document.querySelectorAll('.subject-name-placeholder').forEach(el => el.textContent = subjectName);

         const syllabusInfo = document.getElementById('syllabus-info');
         const notesInfo = document.getElementById('notes-info');
         const pyqInfo = document.getElementById('pyq-info');
         const mockTestInfo = document.getElementById('mock-test-info');
         const relatedBlogsList = document.getElementById('related-blogs');
         const syllabusTrigger = document.getElementById('syllabus-pdf-trigger');
         const notesTrigger = document.getElementById('notes-pdf-trigger');
         const pyqTrigger = document.getElementById('pyq-pdf-trigger');
         const mockTestLink = document.getElementById('mock-test-link');

         if (subjectKey) {
             if(syllabusInfo) syllabusInfo.innerHTML = `Explore the complete official syllabus topics for <strong>${subjectName}</strong> to structure your preparation effectively.`;
             if(notesInfo) notesInfo.innerHTML = `Find curated study notes, chapter summaries, and key concepts tailored for <strong>${subjectName}</strong>.`;
             if(pyqInfo) pyqInfo.innerHTML = `Practice with authentic Previous Year Questions specific to the <strong>${subjectName}</strong> section of the CUET exam.`;
             if(mockTestInfo) mockTestInfo.innerHTML = `Assess your knowledge in <strong>${subjectName}</strong> with dedicated mock tests. Analyze your performance and improve!`;

             if(relatedBlogsList){
                 relatedBlogsList.innerHTML = `
                     <li><a href="#">Effective Study Techniques for ${subjectName}</a> (Link)</li>
                     <li><a href="#">Analyzing ${subjectName} PYQs: Key Insights</a> (Link)</li>
                     <li><a href="#">Top Scoring Topics in CUET ${subjectName}</a> (Link)</li>
                 `;
             }

             const resourceMap = {
                 'GENERAL_SYLLABUS': 'YOUR_GENERAL_SYLLABUS_ID_HERE',
                 'PHYSICS_NOTES': 'YOUR_PHYSICS_NOTES_ID_HERE', 'PHYSICS_PYQ': 'YOUR_PHYSICS_PYQ_ID_HERE',
                 'CHEMISTRY_NOTES': 'YOUR_CHEMISTRY_NOTES_ID_HERE', 'CHEMISTRY_PYQ': 'YOUR_CHEMISTRY_PYQ_ID_HERE',
                 'MATHS_NOTES': 'YOUR_MATHS_NOTES_ID_HERE', 'MATHS_PYQ': 'YOUR_MATHS_PYQ_ID_HERE',
                 'BIOLOGY_NOTES': 'YOUR_BIOLOGY_NOTES_ID_HERE', 'BIOLOGY_PYQ': 'YOUR_BIOLOGY_PYQ_ID_HERE',
                 'ENGLISH_NOTES': 'YOUR_ENGLISH_NOTES_ID_HERE', 'ENGLISH_PYQ': 'YOUR_ENGLISH_PYQ_ID_HERE',
                 'HINDI_NOTES': 'YOUR_HINDI_NOTES_ID_HERE', 'HINDI_PYQ': 'YOUR_HINDI_PYQ_ID_HERE',
                 'GENERALTEST_NOTES': 'YOUR_GENERALTEST_NOTES_ID_HERE', 'GENERALTEST_PYQ': 'YOUR_GENERALTEST_PYQ_ID_HERE',
                 'HISTORY_NOTES': 'YOUR_HISTORY_NOTES_ID_HERE', 'HISTORY_PYQ': 'YOUR_HISTORY_PYQ_ID_HERE',
                 // Add IDs for ALL subjects...
                 'ECONOMICS_NOTES': 'YOUR_ECONOMICS_NOTES_ID_HERE', 'ECONOMICS_PYQ': 'YOUR_ECONOMICS_PYQ_ID_HERE',
                 'ACCOUNTANCY_NOTES': 'YOUR_ACCOUNTANCY_NOTES_ID_HERE', 'ACCOUNTANCY_PYQ': 'YOUR_ACCOUNTANCY_PYQ_ID_HERE',
                 'BUSINESSSTUDIES_NOTES': 'YOUR_BUSINESSSTUDIES_NOTES_ID_HERE', 'BUSINESSSTUDIES_PYQ': 'YOUR_BUSINESSSTUDIES_PYQ_ID_HERE',
                 'GEOGRAPHY_NOTES': 'YOUR_GEOGRAPHY_NOTES_ID_HERE', 'GEOGRAPHY_PYQ': 'YOUR_GEOGRAPHY_PYQ_ID_HERE',
                 'POLITICALSCIENCE_NOTES': 'YOUR_POLITICALSCIENCE_NOTES_ID_HERE', 'POLITICALSCIENCE_PYQ': 'YOUR_POLITICALSCIENCE_PYQ_ID_HERE',
                 'PSYCHOLOGY_NOTES': 'YOUR_PSYCHOLOGY_NOTES_ID_HERE', 'PSYCHOLOGY_PYQ': 'YOUR_PSYCHOLOGY_PYQ_ID_HERE',
             };

             let syllabusId = resourceMap['GENERAL_SYLLABUS'];
             let notesId = resourceMap[`${subjectKey.toUpperCase()}_NOTES`] || 'NOT_FOUND';
             let pyqId = resourceMap[`${subjectKey.toUpperCase()}_PYQ`] || 'NOT_FOUND';

             const syllabusUrl = syllabusId.includes('_ID_HERE') || syllabusId === 'NOT_FOUND' ? '#' : `https://drive.google.com/file/d/${syllabusId}/view?usp=sharing`;
             const notesUrl = notesId.includes('_ID_HERE') || notesId === 'NOT_FOUND' ? '#' : `https://drive.google.com/file/d/${notesId}/view?usp=sharing`;
             const pyqUrl = pyqId.includes('_ID_HERE') || pyqId === 'NOT_FOUND' ? '#' : `https://drive.google.com/file/d/${pyqId}/view?usp=sharing`;

             if (syllabusTrigger) {
                 syllabusTrigger.setAttribute('data-pdf-url', syllabusUrl);
                 syllabusTrigger.style.display = (syllabusUrl === '#') ? 'none' : 'inline-block';
                 document.querySelector('#subject-syllabus-modal input[name="resource_id"]')?.setAttribute('value', `syllabus_${subjectKey}`);
             }
             if (notesTrigger) {
                 notesTrigger.setAttribute('data-pdf-url', notesUrl);
                 notesTrigger.style.display = (notesUrl === '#') ? 'none' : 'inline-block';
                  document.querySelector('#subject-notes-modal input[name="resource_id"]')?.setAttribute('value', `notes_${subjectKey}`);
             }
             if (pyqTrigger) {
                 pyqTrigger.setAttribute('data-pdf-url', pyqUrl);
                 pyqTrigger.style.display = (pyqUrl === '#') ? 'none' : 'inline-block';
                 document.querySelector('#subject-pyq-modal input[name="resource_id"]')?.setAttribute('value', `pyq_${subjectKey}`);
             }
             if (mockTestLink) {
                 mockTestLink.href = `login.html`;
                 mockTestLink.style.display = 'inline-block';
             }

         } else {
             // Handle case where no subject is specified
             if(syllabusInfo) syllabusInfo.textContent = 'Select a subject from the navigation menu to view specific resources.';
             if(notesInfo) notesInfo.textContent = '';
             if(pyqInfo) pyqInfo.textContent = '';
             if(mockTestInfo) mockTestInfo.textContent = '';
             if(relatedBlogsList) relatedBlogsList.innerHTML = '';

             document.querySelectorAll('#subject-content .download-trigger-button, #subject-content .download-link').forEach(el => {
                  if (!el.id || !el.id.includes('mock-test')) {
                      el.style.display = 'none';
                  } else if (mockTestLink){
                      mockTestLink.href = `login.html`;
                      mockTestLink.style.display = 'inline-block';
                  }
             });
         }
    } // End subject page specific logic

}); // End DOMContentLoaded