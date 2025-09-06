// Theme management
let currentTheme = localStorage.getItem('theme') || 'light';

function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	currentTheme = theme;
	localStorage.setItem('theme', theme);
}

function toggleTheme() {
	const newTheme = currentTheme === 'light' ? 'dark' : 'light';
	applyTheme(newTheme);
	updateThemeButton();
}

function updateThemeButton() {
	const themeBtn = document.getElementById('theme-toggle');
	if (themeBtn) {
		themeBtn.innerHTML = currentTheme === 'light' ? '🌙' : '☀️';
		themeBtn.title = `Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`;
	}
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
	applyTheme(currentTheme);
	updateThemeButton();
	
	// Populate language options
	const targetSelect = document.getElementById('target-language');
	if (targetSelect && typeof languages !== 'undefined') {
		targetSelect.innerHTML = '';
		languages.forEach(lang => {
			const option = document.createElement('option');
			option.value = lang.code;
			option.textContent = lang.name;
			targetSelect.appendChild(option);
		});
	}
	
	// Add translate button event listener
	const translateBtn = document.getElementById('translate-btn');
	if (translateBtn) {
		translateBtn.addEventListener('click', handleTranslate);
	}
});

// Translation functionality
async function handleTranslate() {
	const translateBtn = document.getElementById('translate-btn');
	const input = document.getElementById('input-text').value.trim();
	const target = document.getElementById('target-language').value;
	const outputArea = document.getElementById('output-text');
	
	// Animate button
	translateBtn.classList.add('clicked');
	setTimeout(() => translateBtn.classList.remove('clicked'), 300);
	
	outputArea.value = '';
	if (!input) {
		outputArea.value = 'Please enter text to translate.';
		return;
	}
	
	// Disable button during translation
	translateBtn.disabled = true;
	translateBtn.textContent = 'Translating...';
	outputArea.value = 'Translating...';
	
	try {
		// Using MyMemory API (free and reliable)
		const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=en|${target}`);
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const data = await response.json();
		
		if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
			outputArea.value = data.responseData.translatedText;
		} else if (data.matches && data.matches.length > 0) {
			// Fallback to matches if available
			outputArea.value = data.matches[0].translation;
		} else {
			throw new Error('No translation received from API');
		}
	} catch (err) {
		console.error('Translation error:', err);
		outputArea.value = `Translation failed: ${err.message}. Please try again.`;
	} finally {
		// Re-enable button
		translateBtn.disabled = false;
		translateBtn.textContent = 'Translate';
	}
}
...existing code...
