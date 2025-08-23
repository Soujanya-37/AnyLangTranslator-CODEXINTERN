// Language Translator Application
class LanguageTranslator {
  constructor() {
    this.isTranslating = false;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.rapidApiKey = ''; // Will be set by user
    this.sourceLanguage = 'en'; // Always English
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.populateOutputDropdown();
    this.setupSpeechRecognition();
    this.loadPreferences();
    this.setFocus();
    this.checkApiKey();
    
    // Test dropdown functionality
    console.log("Dropdown options loaded:", this.outputLanguageDropdown.querySelectorAll(".option").length);
  }

  setupElements() {
    // Core elements
    this.outputLanguageDropdown = document.querySelector("#output-language");
    this.translateBtn = document.querySelector("#translate-btn");
    this.inputTextElem = document.querySelector("#input-text");
    this.outputTextElem = document.querySelector("#output-text");
    this.inputChars = document.querySelector("#input-chars");
    this.translationStatus = document.querySelector("#translation-status");
    
    // Action buttons
    this.clearBtn = document.querySelector("#clear-btn");
    this.copyBtn = document.querySelector("#copy-btn");
    this.downloadBtn = document.querySelector("#download-btn");
    this.micBtn = document.querySelector("#mic-btn");
    this.speakBtn = document.querySelector("#speak-btn");
    this.darkModeBtn = document.querySelector("#dark-mode-btn");
    this.uploadDocument = document.querySelector("#upload-document");
    
    // UI elements
    this.loadingOverlay = document.querySelector("#loading-overlay");
    this.toastContainer = document.querySelector("#toast-container");
  }

  checkApiKey() {
    const savedApiKey = localStorage.getItem('rapidApiKey');
    if (savedApiKey) {
      this.rapidApiKey = savedApiKey;
      console.log("RapidAPI key loaded from storage");
    } else {
      console.log("No RapidAPI key found - using free Google Translate service");
    }
  }

  showApiKeyPrompt() {
    const apiKey = prompt(
      "Please enter your RapidAPI key for Google Translate services.\n\n" +
      "To get a RapidAPI key:\n" +
      "1. Go to https://rapidapi.com\n" +
      "2. Sign up for a free account\n" +
      "3. Subscribe to 'Google Translate API' on RapidAPI\n" +
      "4. Copy your API key and paste it here\n\n" +
      "Your API key will be saved locally for future use.\n\n" +
      "Leave empty to use free Google Translate service."
    );
    
    if (apiKey && apiKey.trim()) {
      this.rapidApiKey = apiKey.trim();
      localStorage.setItem('rapidApiKey', this.rapidApiKey);
      this.showToast("RapidAPI key saved successfully!", "success");
    } else {
      this.showToast("Using free Google Translate service.", "info");
    }
  }

  setupEventListeners() {
    // Output dropdown functionality
    this.setupOutputDropdown();
    
    // Text input - only update character count, no auto-translation
    this.inputTextElem.addEventListener("input", (e) => {
      this.updateCharCount();
      this.updateTranslateButton();
    });

    // Translate button
    this.translateBtn.addEventListener("click", () => this.translate());

    // Action buttons
    this.clearBtn.addEventListener("click", () => this.clearText());
    this.copyBtn.addEventListener("click", () => this.copyTranslation());
    this.downloadBtn.addEventListener("click", () => this.downloadTranslation());
    this.micBtn.addEventListener("click", () => this.toggleVoiceInput());
    this.speakBtn.addEventListener("click", () => this.speakTranslation());
    this.darkModeBtn.addEventListener("change", () => this.toggleDarkMode());
    this.uploadDocument.addEventListener("change", (e) => this.handleFileUpload(e));

    // Add API key management
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        this.showApiKeyPrompt();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboardShortcuts(e));

    // Close dropdowns when clicking outside
    document.addEventListener("click", (e) => this.handleOutsideClick(e));
  }

  setupOutputDropdown() {
    // Remove any existing event listeners
    const dropdown = this.outputLanguageDropdown;
    const newDropdown = dropdown.cloneNode(true);
    dropdown.parentNode.replaceChild(newDropdown, dropdown);
    this.outputLanguageDropdown = newDropdown;

    // Add click event to dropdown toggle
    this.outputLanguageDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
      this.outputLanguageDropdown.classList.toggle("active");
    });

    // Add event listeners to dropdown options
    this.outputLanguageDropdown.querySelectorAll(".option").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectOutputLanguage(item);
      });
    });
  }

  selectOutputLanguage(item) {
    console.log("Selecting language:", item.dataset.value, item.innerHTML);
    
    // Remove active class from all options
    this.outputLanguageDropdown.querySelectorAll(".option").forEach((option) => {
      option.classList.remove("active");
    });
    
    // Add active class to selected option
    item.classList.add("active");
    
    // Update selected display
    const selected = this.outputLanguageDropdown.querySelector(".selected");
    selected.innerHTML = item.innerHTML;
    selected.dataset.value = item.dataset.value;
    
    // Close dropdown
    this.outputLanguageDropdown.classList.remove("active");
    
    // Show feedback
    this.showToast(`Target language changed to ${item.innerHTML}`, "success");
    
    // Don't auto-translate, let user click the translate button
  }

  populateOutputDropdown() {
    // Filter out English and Auto from the languages list for output
    const outputLanguages = languages.filter(lang => lang.code !== 'en' && lang.code !== 'auto');
    this.populateDropdown(this.outputLanguageDropdown, outputLanguages);
    
    // Set default output language (Spanish)
    this.setDefaultOutputLanguage();
    
    // Setup dropdown event listeners after populating
    this.setupOutputDropdown();
  }

  populateDropdown(dropdown, options) {
    const menu = dropdown.querySelector("ul");
    menu.innerHTML = "";
    
    options.forEach((option) => {
      const li = document.createElement("li");
      const title = `${option.name} (${option.native})`;
      li.innerHTML = title;
      li.dataset.value = option.code;
      li.classList.add("option");
      menu.appendChild(li);
    });
  }

  setDefaultOutputLanguage() {
    // Set Spanish as default output
    const spanishOption = this.outputLanguageDropdown.querySelector('[data-value="es"]');
    if (spanishOption) {
      const outputSelected = this.outputLanguageDropdown.querySelector(".selected");
      outputSelected.innerHTML = spanishOption.innerHTML;
      outputSelected.dataset.value = spanishOption.dataset.value;
      spanishOption.classList.add("active");
    }
  }

  async translate() {
      const inputText = this.inputTextElem.value.trim();
      if (!inputText) {
        this.outputTextElem.value = "";
        this.updateTranslationStatus("Ready to translate");
        return;
      }

      const outputLanguage = this.outputLanguageDropdown.querySelector(".selected").dataset.value;

      // Don't translate if output is English (since input is always English)
      if (outputLanguage === 'en') {
        this.outputTextElem.value = inputText;
        this.updateTranslationStatus("Same language selected");
        return;
      }

      this.isTranslating = true;
      this.showLoading(true);
      this.updateTranslationStatus("Translating...");

      try {
        let translation;
        // Try free Google Translate first (more reliable)
        try {
          console.log("Using free Google Translate service");
          translation = await this.translateWithGoogle(inputText, this.sourceLanguage, outputLanguage);
        } catch (googleError) {
          console.log("Free Google Translate failed, trying RapidAPI...");
          // Fallback to RapidAPI if available
          if (this.rapidApiKey) {
            console.log("Using RapidAPI with key:", this.rapidApiKey.substring(0, 10) + "...");
            translation = await this.translateWithRapidAPI(inputText, this.sourceLanguage, outputLanguage);
          } else {
            throw googleError; // Re-throw if no RapidAPI key
          }
        }

        this.outputTextElem.value = translation;
        this.updateTranslationStatus("Translation complete");
        this.showToast("Translation completed successfully!", "success");
        // Confetti animation
        this.launchConfetti();
      } catch (error) {
        console.error("Translation error details:", error);
        this.outputTextElem.value = "Translation failed. Please try again later.";
        this.updateTranslationStatus("Translation failed");
        // Show more specific error message
        if (error.message.includes("RapidAPI")) {
          this.showToast("Translation service error. Using free service instead.", "warning");
        } else if (error.message.includes("HTTP")) {
          this.showToast("Network error. Please check your internet connection.", "error");
        } else {
          this.showToast("Translation service temporarily unavailable. Please try again.", "error");
        }
      } finally {
        this.isTranslating = false;
        this.showLoading(false);
      }
    }

    // Confetti animation function
    launchConfetti() {
      const canvas = document.getElementById('confetti-canvas');
      if (!canvas) return;
      canvas.innerHTML = '';
      for (let i = 0; i < 40; i++) {
        const conf = document.createElement('div');
        conf.style.position = 'absolute';
        conf.style.left = Math.random() * 90 + '%';
        conf.style.top = '-20px';
        conf.style.width = '8px';
        conf.style.height = '16px';
        conf.style.background = `hsl(${Math.random()*360},80%,70%)`;
        conf.style.borderRadius = '2px';
        conf.style.opacity = '0.8';
        conf.style.transform = `rotate(${Math.random()*360}deg)`;
        conf.style.transition = 'top 1.2s cubic-bezier(.4,2,.3,1), opacity 1.2s';
        canvas.appendChild(conf);
        setTimeout(() => {
          conf.style.top = '120px';
          conf.style.opacity = '0';
        }, 50);
      }
      setTimeout(() => { canvas.innerHTML = ''; }, 1400);
    }

  async translateWithRapidAPI(text, sourceLang, targetLang) {
    console.log(`Translating from ${sourceLang} to ${targetLang}: "${text}"`);
    
    // Using Google Translate API via RapidAPI
    const url = 'https://google-translate1.p.rapidapi.com/language/translate/v2';
    
    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Accept-Encoding': 'application/gzip',
        'X-RapidAPI-Key': this.rapidApiKey,
        'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com'
      },
      body: new URLSearchParams({
        q: text,
        target: targetLang,
        source: sourceLang
      })
    };

    console.log("Making RapidAPI request to:", url);
    const response = await fetch(url, options);
    
    console.log("RapidAPI response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("RapidAPI error response:", errorText);
      throw new Error(`RapidAPI Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log("RapidAPI response data:", data);
    
    if (data && data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    } else {
      console.error("Invalid RapidAPI response structure:", data);
      throw new Error("Invalid response from RapidAPI Google Translate");
    }
  }

  async translateWithGoogle(text, sourceLang, targetLang) {
    console.log(`Using free Google Translate: ${sourceLang} to ${targetLang}`);
    
    // Fallback to Google Translate API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    console.log("Making Google Translate request to:", url);
    const response = await fetch(url);
    
    console.log("Google Translate response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Translate error response:", errorText);
      throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Google Translate response data:", data);
    
    if (data && data[0]) {
      return data[0].map((item) => item[0]).join("");
    } else {
      console.error("Invalid Google Translate response structure:", data);
      throw new Error("Unexpected API response format");
    }
  }

  updateCharCount() {
    const count = this.inputTextElem.value.length;
    this.inputChars.textContent = count;
    
    // Visual feedback for character limit
    if (count > 4500) {
      this.inputChars.style.color = "var(--warning-color)";
    } else if (count > 4000) {
      this.inputChars.style.color = "var(--text-secondary)";
    } else {
      this.inputChars.style.color = "var(--text-muted)";
    }
  }

  updateTranslateButton() {
    const text = this.inputTextElem.value;
    
    // Limit to 5000 characters
    if (text.length > 5000) {
      this.inputTextElem.value = text.slice(0, 5000);
      this.updateCharCount();
    }

    // Enable/disable translate button based on content
    if (text.trim().length > 0) {
      this.translateBtn.disabled = false;
      this.translateBtn.style.background = "var(--primary-color)";
    } else {
      this.translateBtn.disabled = true;
      this.translateBtn.style.background = "var(--text-muted)";
      this.outputTextElem.value = "";
      this.updateTranslationStatus("Ready to translate");
    }
  }

  clearText() {
    this.inputTextElem.value = "";
    this.outputTextElem.value = "";
    this.updateCharCount();
    this.updateTranslateButton();
    this.updateTranslationStatus("Ready to translate");
    this.inputTextElem.focus();
    this.showToast("Text cleared", "success");
  }

  async copyTranslation() {
    const translation = this.outputTextElem.value;
    if (!translation.trim()) {
      this.showToast("No translation to copy", "warning");
      return;
    }

    try {
      await navigator.clipboard.writeText(translation);
      this.showToast("Translation copied to clipboard!", "success");
      
      // Visual feedback
      this.copyBtn.style.background = "var(--success-color)";
      this.copyBtn.style.color = "white";
      setTimeout(() => {
        this.copyBtn.style.background = "";
        this.copyBtn.style.color = "";
      }, 1000);
    } catch (error) {
      console.error("Copy failed:", error);
      this.showToast("Failed to copy translation", "error");
    }
  }

  downloadTranslation() {
    const translation = this.outputTextElem.value;
    if (!translation.trim()) {
      this.showToast("No translation to download", "warning");
      return;
    }

    const outputLanguage = this.outputLanguageDropdown.querySelector(".selected").dataset.value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `translation-${outputLanguage}-${timestamp}.txt`;

    const blob = new Blob([translation], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    this.showToast("Translation downloaded!", "success");
  }

  setupSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US'; // Always English

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.inputTextElem.value = transcript;
        this.updateCharCount();
        this.updateTranslateButton();
        this.micBtn.classList.remove("recording");
      };

      this.recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.micBtn.classList.remove("recording");
        this.showToast("Voice input failed", "error");
      };

      this.recognition.onend = () => {
        this.micBtn.classList.remove("recording");
      };
    } else {
      this.micBtn.style.display = "none";
    }
  }

  toggleVoiceInput() {
    if (!this.recognition) {
      this.showToast("Voice input not supported", "warning");
      return;
    }

    if (this.micBtn.classList.contains("recording")) {
      this.recognition.stop();
    } else {
      this.recognition.start();
      this.micBtn.classList.add("recording");
    }
  }

  speakTranslation() {
    const translation = this.outputTextElem.value;
    if (!translation.trim()) {
      this.showToast("No translation to speak", "warning");
      return;
    }

    const outputLanguage = this.outputLanguageDropdown.querySelector(".selected").dataset.value;
    
    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = this.getLanguageCode(outputLanguage);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    this.synthesis.speak(utterance);
    this.showToast("Playing translation...", "success");
  }

  getLanguageCode(langCode) {
    // Map language codes to speech synthesis codes
    const languageMap = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW'
    };
    return languageMap[langCode] || langCode;
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
      this.showToast("Please upload a valid file (TXT, PDF, DOC, or DOCX)", "error");
      return;
    }

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const limitedContent = content.length > 5000 ? content.slice(0, 5000) : content;
        this.inputTextElem.value = limitedContent;
        this.updateCharCount();
        this.updateTranslateButton();
        this.showToast("File uploaded successfully!", "success");
      };
      reader.readAsText(file);
    } else {
      this.showToast("For best results, please copy and paste text from PDF/DOC files", "warning");
    }

    // Reset file input
    event.target.value = "";
  }

  toggleDarkMode() {
    const isDark = this.darkModeBtn.checked;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem("darkMode", isDark);
    this.showToast(`${isDark ? 'Dark' : 'Light'} mode enabled`, "success");
  }

  handleKeyboardShortcuts(event) {
    // Ctrl+Enter to translate
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      this.translate();
    }

    // Ctrl+S to download
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault();
      this.downloadTranslation();
    }

    // Ctrl+C to copy translation
    if (event.ctrlKey && event.key === "c" && document.activeElement === this.outputTextElem) {
      event.preventDefault();
      this.copyTranslation();
    }

    // Ctrl+K to manage API key
    if (event.ctrlKey && event.key === "k") {
      event.preventDefault();
      this.showApiKeyPrompt();
    }

    // Ctrl+T to test API connection
    if (event.ctrlKey && event.key === "t") {
      event.preventDefault();
      this.testAPIConnection();
    }
  }

  handleOutsideClick(event) {
    if (!this.outputLanguageDropdown.contains(event.target)) {
      this.outputLanguageDropdown.classList.remove("active");
    }
  }

  updateTranslationStatus(status) {
    this.translationStatus.textContent = status;
  }

  showLoading(show) {
    if (show) {
      this.loadingOverlay.classList.add("show");
    } else {
      this.loadingOverlay.classList.remove("show");
    }
  }

  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = document.createElement("ion-icon");
    icon.name = this.getToastIcon(type);
    
    const text = document.createElement("span");
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    this.toastContainer.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add("show"), 100);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: "checkmark-circle-outline",
      error: "close-circle-outline",
      warning: "warning-outline",
      info: "information-circle-outline"
    };
    return icons[type] || icons.info;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  loadPreferences() {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
      this.darkModeBtn.checked = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  setFocus() {
    this.inputTextElem.focus();
    this.updateTranslateButton(); // Initialize button state
  }

  // Test API connection
  async testAPIConnection() {
    console.log("Testing API connection...");
    try {
      const testText = "Hello";
      const result = await this.translateWithGoogle(testText, 'en', 'es');
      console.log("API test successful:", result);
      this.showToast("API connection test successful!", "success");
    } catch (error) {
      console.error("API test failed:", error);
      this.showToast("API connection test failed. Check console for details.", "error");
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new LanguageTranslator();
});