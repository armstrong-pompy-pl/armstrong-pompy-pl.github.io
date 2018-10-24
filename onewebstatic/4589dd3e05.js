window.OnewebContactForm = function ($) {
    var ContactFormValidation;
    var htmlEncode = function (str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };
    ContactFormValidation = function (cfg) {
        try {
            this.init(cfg);
        } catch (e) {
            throw new Error('ContactForm Validation initialization failed');
        }
    };
    ContactFormValidation.prototype = {
        constructor: window.OnewebContactForm,
        init: function (cfg) {
            this.formDOMId = cfg.formDOMId;
            this.postURL = cfg.postURL;
            this.recipientEmail = decodeURIComponent(cfg.recipientEmail);
            this.successMessage = decodeURIComponent(cfg.successMessage);
            this.errorMessage = decodeURIComponent(cfg.errorMessage);
            this.formElementsErrorMessages = JSON.parse(cfg.formElementsErrorMessages);
            this.allFieldErrorMessage = JSON.parse(cfg.allFieldErrorMessage);
            this.emailRegex = new RegExp(cfg.emailRegex, 'i');
            this.urlRegex = new RegExp(cfg.urlRegex);
            this.numberRegex = /^[0-9+\(\)#\.\s]+$/;
            this.numberQuery = 'input[ctype="number"]';
            this.previewMode = cfg.previewMode;
            this.attachSubmitEvent();
            this.attachNumberInputValidation();
            this.formFieldErrors = [];
            this.contactFormDOM = {};
            this.formData = {
                recipient: this.recipientEmail,
                email: this.recipientEmail,
                subject: decodeURIComponent(cfg.subject)
            };
            this.defaultFormData = $.extend({}, this.formData);
            this.originalCharset = this.getDocumentCharset();
            this.attachSubmitEvent();
        },
        attachSubmitEvent: function () {
            $('.oneWebCntForm input[type="submit"]').click($.proxy(this.validateForm, this));
        },
        attachNumberInputValidation: function () {
            var regex = this.numberRegex;
            $('.contact-form-field-container > ' + this.numberQuery).on('input', function () {
                var $this = $(this), value = $this.val();
                if (!regex.test(value)) {
                    var pattern = '[^' + regex.source.replace(/^\^\[(.*?)\]\+\$$/, '$1') + ']';
                    var newValue = value.replace(new RegExp(pattern, 'g'), '');
                    $this.val(newValue);
                }
            });
        },
        validateForm: function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.removeSuccessMessageOnFormFields($('#contactFormResponseContainer'));
            this.contactFormDOM = $('.oneWebCntForm');
            this.removeErrorMessageWarningOnFormFields(this.contactFormDOM);
            this.setDocumentCharset('ISO-8859-1');
            if (this.getFormValidationErrors(this.contactFormDOM) === 0) {
                this.updateFormData(this.contactFormDOM);
                if (this.isHiddenFieldEmpty() && !this.previewMode) {
                    this.postContactForm();
                    this.formData = $.extend(true, {}, this.defaultFormData);
                }
            } else {
                var errEl = $('.contact-form-field-container .error-message')[0];
                if (errEl) {
                    errEl.scrollIntoView();
                }
                this.setDocumentCharset(this.originalCharset);
                return false;
            }
        },
        removeErrorMessageWarningOnFormFields: function (formDOM) {
            $(formDOM).find('.error-message').remove();
        },
        removeSuccessMessageOnFormFields: function (successMsgDOM) {
            $(successMsgDOM).html('').removeClass('formSuccess');
        },
        getFormValidationErrors: function (formDOM) {
            var formFields = formDOM.find('.contact-form-field-container'), emailRegex = this.emailRegex, urlRegex = this.urlRegex, messageRegex = /^\S*/g, numberRegex = this.numberRegex, errors = 0;
            $.each(formFields, $.proxy(function (index, element) {
                var errorMessage = this.formElementsErrorMessages[index], inputFieldVal, errorFound = false, text;
                var $numberField = $(element).find(this.numberQuery), isNumberField = $numberField.length === 1;
                errorMessage = errorMessage && decodeURIComponent(errorMessage);
                if ($(element).find('input[type="text"]')[0] && !isNumberField && errorMessage) {
                    text = $.trim($(element).find('input[type="text"]').val());
                    if (!text.length && text.match(messageRegex)) {
                        errorFound = true;
                    }
                } else if ($(element).find('input[type="email"]')[0]) {
                    inputFieldVal = $(element).find('input[type="email"]').val();
                    if (errorMessage || inputFieldVal) {
                        errorMessage = errorMessage || decodeURIComponent(this.allFieldErrorMessage[index]);
                        if (!emailRegex.test(inputFieldVal)) {
                            errorFound = true;
                        }
                    }
                } else if ($(element).find('input[type="url"]')[0]) {
                    inputFieldVal = $(element).find('input[type="url"]').val();
                    if (errorMessage || inputFieldVal) {
                        errorMessage = errorMessage || decodeURIComponent(this.allFieldErrorMessage[index]);
                        if (!urlRegex.test(inputFieldVal) && !urlRegex.test('http://' + inputFieldVal)) {
                            errorFound = true;
                        }
                    }
                } else if (isNumberField) {
                    inputFieldVal = $numberField.val();
                    if (errorMessage || inputFieldVal) {
                        errorMessage = errorMessage || decodeURIComponent(this.allFieldErrorMessage[index]);
                        if (!inputFieldVal.match(numberRegex)) {
                            errorFound = true;
                        }
                    }
                } else if ($(element).find('input[type="tel"]')[0]) {
                    inputFieldVal = $(element).find('input[type="tel"]').val();
                    if (errorMessage || inputFieldVal) {
                        errorMessage = errorMessage || decodeURIComponent(this.allFieldErrorMessage[index]);
                        if (!inputFieldVal.match(numberRegex)) {
                            errorFound = true;
                        }
                    }
                } else if ($(element).find('input[type="checkbox"]').length > 0 && errorMessage) {
                    if (!$(element).find('input[type="checkbox"]:checked')[0]) {
                        errorFound = true;
                    }
                } else if ($(element).find('input[type="radio"]').length > 0 && errorMessage) {
                    if (!$(element).find('input[type="radio"]:checked')[0]) {
                        errorFound = true;
                    }
                } else if ($(element).find('textarea')[0] && errorMessage) {
                    text = $.trim($(element).find('textarea').val());
                    if (!text.length && text.match(messageRegex)) {
                        errorFound = true;
                    }
                } else if ($(element).find('select')[0] && errorMessage) {
                    var selectedValue = $(element).find('select').val();
                    if (!selectedValue && selectedValue !== '--') {
                        errorFound = true;
                    }
                }
                var errContainer = $(element).next();
                if (errorFound) {
                    errContainer.html(htmlEncode(errorMessage));
                    errors = errors + 1;
                } else {
                    errContainer.html('&nbsp;');
                }
            }, this));
            return errors;
        },
        updateFormData: function (formDOM) {
            var formFields = $(formDOM).find('.contact-form-field-container');
            $.each(formFields, $.proxy(function (index, element) {
                var labelName = $(element).find('label').text().replace(' *', '');
                if ($(element).find('input[type="text"]')[0] || $(element).find('input[type="url"]')[0] || $(element).find(this.numberQuery)[0] || $(element).find('input[type="tel"]')[0]) {
                    this.formData[labelName] = $(element).find('input').val();
                } else if ($(element).find('input[type="email"]')[0]) {
                    labelName = labelName === 'email' ? 'Email' : labelName;
                    if (!this.formData.replyto) {
                        this.formData.replyto = this.formData[labelName] = $(element).find('input').val();
                    } else {
                        this.formData[labelName] = $(element).find('input').val();
                    }
                } else if ($(element).find('input[type="checkbox"]:checked')[0]) {
                    this.formData[labelName] = $(element).find('input[type="checkbox"]:checked').map(function (index, ele) {
                        return $(ele).val();
                    }).get();
                } else if ($(element).find('input[type="radio"]:checked')[0]) {
                    this.formData[labelName] = $(element).find('input[type="radio"]:checked').val();
                } else if ($(element).find('select')[0]) {
                    this.formData[labelName] = $(element).find('select').val();
                } else if ($(element).find('textarea')[0]) {
                    this.formData[labelName] = $(element).find('textarea').val();
                }
            }, this));
        },
        getEncodedFormData: function () {
            var encodedFormData = '';
            for (var key in this.formData) {
                encodedFormData += unescape(encodeURIComponent(escape(key))).replace(/\+/g, '%2B') + '=' + unescape(encodeURIComponent(escape(this.formData[key]))).replace(/\+/g, '%2B') + '&';
            }
            encodedFormData = encodedFormData.substring(0, encodedFormData.length - 1);
            return encodedFormData;
        },
        isHiddenFieldEmpty: function () {
            return $(this.contactFormDOM).find('.oneweb-hidden-field>input').text() === '';
        },
        postContactForm: function () {
            $.ajax({
                type: 'POST',
                url: this.postURL,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                },
                data: this.getEncodedFormData(),
                success: $.proxy(this.ajaxSuccess, this),
                error: $.proxy(this.ajaxError, this)
            });
        },
        ajaxSuccess: function (responseText) {
            var responseStatus = $('#contactFormResponseContainer');
            if (/<title>\s*Error/i.test(responseText)) {
                $(responseStatus).html(htmlEncode(this.errorMessage)).addClass('formError').removeClass('formSuccess');
            } else {
                $(responseStatus).html(htmlEncode(this.successMessage)).addClass('formSuccess').removeClass('formError');
                ;
            }
            this.resetDocument();
        },
        ajaxError: function () {
            var responseStatus = $('#contactFormResponseContainer');
            $(responseStatus).html(this.errorMessage).addClass('formError');
        },
        resetDocument: function () {
            $(this.contactFormDOM).trigger('reset');
            this.setDocumentCharset(this.originalCharset);
        },
        getDocumentCharset: function () {
            return document.characterSet || document.charset;
        },
        setDocumentCharset: function (charset) {
            if (document.charset) {
                document.charset = charset;
            } else {
                document.characterSet = charset;
            }
        }
    };
    return ContactFormValidation;
}(oneJQuery);
(function () {
    oneJQuery(function () {
        oneJQuery('.oneWebCntForm .contact-form-submit-btn').prop('disabled', false);
        new window.OnewebContactForm({
            'formDOMId': '38A9FDA3-4A64-419A-9132-8680EA178228',
            'postURL': '/cgi-bin/FormMail.pl',
            'recipientEmail': 'biuro%40armstrong-pompy.pl',
            'subject': 'New%20message%20via%20contact%20form%20on%20armstrong-pompy.pl%20-%20KONTAKT%20page',
            'successMessage': 'Dzi%C4%99kujemy%20za%20zainteresowanie%20naszymi%20produktami.%20Nasz%20zesp%C3%B3%C5%82%20odpowie%20tak%20szybko%20jak%20b%C4%99dzie%20to%20mo%C5%BCliwe.',
            'errorMessage': 'Something%20went%20wrong.%20Please%20try%20again%20later.',
            'emailRegex': '^[a-z0-9!#$%&\'*+\\/=?\\^_`{|}~\\-:][\\.a-z0-9!#$%&\'*+\\/=?\\^_`{|}~\\-]*@(?:[a-z0-9](?:[\\-a-z0-9]*[a-z0-9])?\\.)+[a-z](?:[\\-a-z]*[a-z])?$',
            'urlRegex': '^(https?:\\/\\/(?:[^:@\\/]+(?::[^@\\/]+?)?@)?(?:(?:[a-z0-9ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�](?:[\\-a-z0-9ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�]*[a-z0-9ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�])?\\.)+[a-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�](?:[\\-a-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�]*[a-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԥԱ-Ֆՙա-ևא-תװ-ײء-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨऄ-हऽॐक़-ॡॱॲॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿋ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-鶴侮-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ̀-ͯ҃-҉֑-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٞۖ-ۜ۞-۪ۤۧۨ-ܑۭܰ-݊ަ-ް߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࠭ऀ-ः़ा-ॎ॑-ॕॢॣঁ-ঃ়া-ৄেৈো-্ৗৢৣਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑੰੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣஂா-ூெ-ைொ-்ௗఁ-ఃా-ౄె-ైొ-్ౕౖౢౣಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣംഃാ-ൄെ-ൈൊ-്ൗൢൣංඃ්ා-ුූෘ-ෟෲෳัิ-ฺ็-๎ັິ-ູົຼ່-ໍ༹༘༙༵༷༾༿ཱ-྄྆྇ྐ-ྗྙ-ྼ࿆ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ፟ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳា-៓៝᠋-᠍ᢩᤠ-ᤫᤰ-᤻ᦰ-ᧀᧈᧉᨗ-ᨛᩕ-ᩞ᩠-᩿᩼ᬀ-ᬄ᬴-᭄᭫-᭳ᮀ-ᮂᮡ-᮪ᰤ-᰷᳐-᳔᳒-᳨᳭ᳲ᷀-᷽ᷦ-᷿⃐-⃰⳯-⳱ⷠ-〪ⷿ-゙゚〯꙯-꙲꙼꙽꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣠-꣱ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀ꨩ-ꨶꩃꩌꩍꩻꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꯣ-ꯪ꯬꯭ﬞ︀-️︠-︦²³¹¼-¾٠-٩۰-۹߀-߉०-९০-৯৴-৹੦-੯૦-૯୦-୯௦-௲౦-౯౸-౾೦-೯൦-൵๐-๙໐-໙༠-༳၀-၉႐-႙፩-፼ᛮ-ᛰ០-៩៰-៹᠐-᠙᥆-᥏᧐-᧚᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙⁰⁴-⁹₀-₉⅐-ↂↅ-↉①-⒛⓪-⓿❶-➓⳽〇〡-〩〸-〺㆒-㆕㈠-㈩㉑-㉟㊀-㊉㊱-㊿꘠-꘩ꛦ-ꛯ꠰-꠵꣐-꣙꤀-꤉꧐-꧙꩐-꩙꯰-꯹０-９¡«·»¿;·՚-՟։֊־׀׃׆׳״؉؊،؍؛؞؟٪-٭۔܀-܍߷-߹࠰-࠾।॥॰෴๏๚๛༄-༒༺-༽྅࿐-࿔၊-၏჻፡-፨᐀᙭᙮᚛᚜᛫-᛭᜵᜶។-៖៘-៚᠀-᠊᥄᥅᧞᧟᨞᨟᪠-᪦᪨-᪭᭚-᭠᰻-᰿᱾᱿᳓‐-‧‰-⁃⁅-⁑⁓-⁞⁽⁾₍₎〈〉❨-❵⟅⟆⟦-⟯⦃-⦘⧘-⧛⧼⧽⳹-⳼⳾⳿⸀-⸮⸰⸱、-〃〈-】〔-〟〰〽゠・꓾꓿꘍-꘏꙳꙾꛲-꛷꡴-꡷꣎꣏꣸-꣺꤮꤯꥟꧁-꧍꧞꧟꩜-꩟꫞꫟꯫﴾﴿︐-︙︰-﹒﹔-﹡﹣﹨﹪﹫！-＃％-＊，-／：；？＠［-］＿｛｝｟-･¢-©¬®-±´¶¸×÷˂-˅˒-˟˥-˫˭˯-˿͵΄΅϶҂؆-؈؋؎؏۩۽۾߶৲৳৺৻૱୰௳-௺౿ೱೲ൹฿༁-༃༓-༗༚-༟༴༶༸྾-࿅࿇-࿌࿎࿏࿕-࿘႞႟፠᎐-᎙៛᥀᧠-᧿᭡-᭪᭴-᭼᾽᾿-῁῍-῏῝-῟῭-`´῾⁄⁒⁺-⁼₊-₌₠-₸℀℁℃-℆℈℉℔№-℘℞-℣℥℧℩℮℺℻⅀-⅄⅊-⅍⅏←-⌨⌫-⏨␀-␦⑀-⑊⒜-ⓩ─-⛍⛏-⛡⛣⛨-⛿✁-✄✆-✉✌-✧✩-❋❍❏-❒❖-❞❡-❧➔➘-➯➱-➾⟀-⟄⟇-⟊⟌⟐-⟥⟰-⦂⦙-⧗⧜-⧻⧾-⭌⭐-⭙⳥-⳪⺀-⺙⺛-⻳⼀-⿕⿰-⿻〄〒〓〠〶〷〾〿゛゜㆐㆑㆖-㆟㇀-㇣㈀-㈞㈪-㉐㉠-㉿㊊-㊰㋀-㋾㌀-㏿䷀-䷿꒐-꓆꜀-꜖꜠꜡꞉꞊꠨-꠫꠶-꠹꩷-꩹﬩﷼﷽﹢﹤-﹦﹩＄＋＜-＞＾｀｜～￠-￦￨-￮￼�])?|(?:(?:[0-9]|1?[0-9][0-9]|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|1?[0-9][0-9]|2[0-4][0-9]|25[0-5]))(?::\\d{1,5})?(?:\\/[\\w\\-\\.~%!$&\'\\(\\)*+,;=:@\\/]*(?:\\?[\\w\\-\\.~%!$&\'\\(\\)*+,;=:@\\/?]*)?(?:#[\\w\\-\\.~%!$&\'\\(\\)*+,;=:@\\/?#]*)?)?)$',
            'previewMode': false,
            'formElementsErrorMessages': '{"0":"Please%20enter%20a%20valid%20name","1":"Please%20enter%20a%20valid%20email%20address.","2":null,"3":"Please%20enter%20a%20valid%20subject","4":"Please%20enter%20a%20valid%20message"}',
            'allFieldErrorMessage': '{"0":"Please%20enter%20a%20valid%20name","1":"Please%20enter%20a%20valid%20email%20address.","2":"Please%20enter%20a%20valid%20phone%20number","3":"Please%20enter%20a%20valid%20subject","4":"Please%20enter%20a%20valid%20message"}'
        });
    });
}());