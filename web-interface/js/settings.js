import { CONFIG } from './config.js';

// Settings management class
export class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.isVisible = false;
    }

    // Load settings from localStorage or use defaults
    loadSettings() {
        const saved = localStorage.getItem('cobalt-settings');
        if (saved) {
            try {
                return { ...CONFIG.DEFAULT_OPTIONS, ...JSON.parse(saved) };
            } catch (error) {
                console.warn('Failed to parse saved settings:', error);
            }
        }
        return { ...CONFIG.DEFAULT_OPTIONS };
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('cobalt-settings', JSON.stringify(this.settings));
    }

    // Get current settings
    getSettings() {
        return {
            ...this.settings
        };
    }

    // Update a specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    // Reset to default settings
    resetSettings() {
        this.settings = { ...CONFIG.DEFAULT_OPTIONS };
        this.saveSettings();
        this.updateUI();
    }

    // Reset to defaults with confirmation
    resetToDefaults() {
        if (confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
            this.resetSettings();
        }
    }

    // Create settings UI
    createSettingsUI() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        const settingsHTML = `
            <div class="settings-content">
                <div class="settings-header">
                    <h2 class="settings-title">
                        <i class="fas fa-cog mr-2"></i>Cài đặt tải xuống
                    </h2>
                    <button class="settings-close" id="close-settings">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="general">
                        <i class="fas fa-sliders-h mr-1"></i>Tổng quát
                    </button>
                    <button class="settings-tab" data-tab="audio">
                        <i class="fas fa-music mr-1"></i>Âm thanh
                    </button>
                    <button class="settings-tab" data-tab="youtube">
                        <i class="fab fa-youtube mr-1"></i>YouTube
                    </button>
                    <button class="settings-tab" data-tab="tiktok">
                        <i class="fab fa-tiktok mr-1"></i>TikTok
                    </button>
                    <button class="settings-tab" data-tab="advanced">
                        <i class="fas fa-cogs mr-1"></i>Nâng cao
                    </button>
                </div>

                <!-- General Tab -->
                <div class="settings-tab-content active" id="tab-general">
                    <div class="settings-group">
                        <h3 class="settings-group-title">Cài đặt video</h3>
                        
                        <div class="settings-field">
                            <label class="settings-label">Chất lượng video:</label>
                            <div class="radio-buttons-group compact" id="videoQuality-group">
                                <label class="radio-button ${this.settings.videoQuality === 'max' ? 'active' : ''}" data-value="max">
                                    <input type="radio" name="videoQuality" value="max" ${this.settings.videoQuality === 'max' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-crown"></i>
                                        <span>Tối đa</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.videoQuality === '2160' ? 'active' : ''}" data-value="2160">
                                    <input type="radio" name="videoQuality" value="2160" ${this.settings.videoQuality === '2160' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-gem"></i>
                                        <span>4K</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.videoQuality === '1440' ? 'active' : ''}" data-value="1440">
                                    <input type="radio" name="videoQuality" value="1440" ${this.settings.videoQuality === '1440' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-medal"></i>
                                        <span>2K</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.videoQuality === '1080' ? 'active' : ''}" data-value="1080">
                                    <input type="radio" name="videoQuality" value="1080" ${this.settings.videoQuality === '1080' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-star"></i>
                                        <span>1080p</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.videoQuality === '720' ? 'active' : ''}" data-value="720">
                                    <input type="radio" name="videoQuality" value="720" ${this.settings.videoQuality === '720' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-circle"></i>
                                        <span>720p</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.videoQuality === '480' ? 'active' : ''}" data-value="480">
                                    <input type="radio" name="videoQuality" value="480" ${this.settings.videoQuality === '480' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-dot-circle"></i>
                                        <span>480p</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="settings-field">
                            <label class="settings-label">Chế độ tải:</label>
                            <div class="radio-buttons-group compact" id="downloadMode-group">
                                <label class="radio-button ${this.settings.downloadMode === 'auto' ? 'active' : ''}" data-value="auto">
                                    <input type="radio" name="downloadMode" value="auto" ${this.settings.downloadMode === 'auto' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-video"></i>
                                        <span>Video + Âm thanh</span>
                                        <small>Tự động</small>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.downloadMode === 'audio' ? 'active' : ''}" data-value="audio">
                                    <input type="radio" name="downloadMode" value="audio" ${this.settings.downloadMode === 'audio' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-music"></i>
                                        <span>Chỉ âm thanh</span>
                                        <small>Audio only</small>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.downloadMode === 'mute' ? 'active' : ''}" data-value="mute">
                                    <input type="radio" name="downloadMode" value="mute" ${this.settings.downloadMode === 'mute' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-video-slash"></i>
                                        <span>Chỉ video</span>
                                        <small>No audio</small>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="disableMetadata" ${this.settings.disableMetadata ? 'checked' : ''}>
                                Tắt metadata (tiêu đề, nghệ sĩ, v.v.)
                            </label>
                        </div>

                        <div class="settings-field">
                            <label class="settings-label">Kiểu tên file:</label>
                            <div class="radio-buttons-group compact" id="filenameStyle-group">
                                <label class="radio-button ${this.settings.filenameStyle === 'classic' ? 'active' : ''}" data-value="classic">
                                    <input type="radio" name="filenameStyle" value="classic" ${this.settings.filenameStyle === 'classic' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-clock"></i>
                                        <span>Cổ điển</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.filenameStyle === 'pretty' ? 'active' : ''}" data-value="pretty">
                                    <input type="radio" name="filenameStyle" value="pretty" ${this.settings.filenameStyle === 'pretty' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-heart"></i>
                                        <span>Đẹp</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.filenameStyle === 'basic' ? 'active' : ''}" data-value="basic">
                                    <input type="radio" name="filenameStyle" value="basic" ${this.settings.filenameStyle === 'basic' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-file"></i>
                                        <span>Cơ bản</span>
                                    </div>
                                </label>
                                <label class="radio-button ${this.settings.filenameStyle === 'nerdy' ? 'active' : ''}" data-value="nerdy">
                                    <input type="radio" name="filenameStyle" value="nerdy" ${this.settings.filenameStyle === 'nerdy' ? 'checked' : ''} style="display: none;">
                                    <div class="radio-content">
                                        <i class="fas fa-code"></i>
                                        <span>Chi tiết</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Audio Tab -->
                <div class="settings-tab-content" id="tab-audio">
                    <div class="settings-group">
                        <h3 class="settings-group-title">Cài đặt âm thanh</h3>
                        
                        <div class="settings-field">
                            <label class="settings-label" for="audioFormat">Định dạng âm thanh:</label>
                            <select id="audioFormat" class="settings-select">
                                ${this.createOptions('audioFormat')}
                            </select>
                        </div>

                        <div class="settings-field">
                            <label class="settings-label" for="audioBitrate">Bitrate âm thanh:</label>
                            <select id="audioBitrate" class="settings-select">
                                ${this.createOptions('audioBitrate')}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- YouTube Tab -->
                <div class="settings-tab-content" id="tab-youtube">
                    <div class="settings-group">
                        <h3 class="settings-group-title">Cài đặt YouTube</h3>
                        
                        <div class="settings-field">
                            <label class="settings-label" for="youtubeVideoCodec">Codec video:</label>
                            <select id="youtubeVideoCodec" class="settings-select">
                                ${this.createOptions('youtubeVideoCodec')}
                            </select>
                        </div>

                        <div class="settings-field">
                            <label class="settings-label" for="youtubeDubLang">Ngôn ngữ lồng tiếng:</label>
                            <input type="text" id="youtubeDubLang" class="settings-input" 
                                   placeholder="Ví dụ: en, vi, zh-CN" value="${this.settings.youtubeDubLang || ''}">
                        </div>

                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="youtubeBetterAudio" ${this.settings.youtubeBetterAudio ? 'checked' : ''}>
                                Ưu tiên âm thanh chất lượng cao
                            </label>
                        </div>

                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="youtubeHLS" ${this.settings.youtubeHLS ? 'checked' : ''}>
                                Sử dụng định dạng HLS
                            </label>
                        </div>
                    </div>
                </div>

                <!-- TikTok Tab -->
                <div class="settings-tab-content" id="tab-tiktok">
                    <div class="settings-group">
                        <h3 class="settings-group-title">Cài đặt TikTok</h3>
                        
                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="tiktokFullAudio" ${this.settings.tiktokFullAudio ? 'checked' : ''}>
                                Tải âm thanh gốc
                            </label>
                        </div>

                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="allowH265" ${this.settings.allowH265 ? 'checked' : ''}>
                                Cho phép video H265/HEVC
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Advanced Tab -->
                <div class="settings-tab-content" id="tab-advanced">
                    <div class="settings-group">
                        <h3 class="settings-group-title">Cài đặt nâng cao</h3>
                        
                        <div class="settings-field">
                            <label class="settings-label" for="apiKey">API Key (tùy chọn):</label>
                            <input type="text" id="apiKey" class="settings-input" 
                                   placeholder="Nhập API key của bạn" value="${this.settings.apiKey || ''}">
                        </div>

                        <div class="settings-field">
                            <label class="settings-checkbox">
                                <input type="checkbox" id="convertGif" ${this.settings.convertGif ? 'checked' : ''}>
                                Chuyển đổi Twitter GIF thành GIF thực
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="settings-reset" id="reset-settings">
                        <i class="fas fa-undo mr-1"></i>Đặt lại mặc định
                    </button>
                    <button class="settings-save" id="save-settings">
                        <i class="fas fa-save mr-1"></i>Lưu cài đặt
                    </button>
                </div>
            </div>
        `;

        modal.innerHTML = settingsHTML;
        this.bindEvents();
    }

    // Create option elements for select
    createOptions(settingKey) {
        const options = CONFIG.OPTION_LABELS[settingKey];
        if (!options) return '';

        return Object.entries(options).map(([value, label]) =>
            `<option value="${value}" ${this.settings[settingKey] === value ? 'selected' : ''}>${label}</option>`
        ).join('');
    }

    // Bind events to settings UI
    bindEvents() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        const closeBtn = document.getElementById('close-settings');
        const saveBtn = document.getElementById('save-settings');
        const resetBtn = document.getElementById('reset-settings');

        // Close modal
        closeBtn?.addEventListener('click', () => this.hideSettings());

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideSettings();
            }
        });

        // Save settings
        saveBtn?.addEventListener('click', () => {
            this.saveCurrentSettings();
            this.hideSettings();
        });

        // Reset settings
        resetBtn?.addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Tab switching
        const tabs = modal.querySelectorAll('.settings-tab');
        const tabContents = modal.querySelectorAll('.settings-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update active content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`tab-${tabId}`)?.classList.add('active');
            });
        });

        // Real-time updates for selects and inputs
        modal.querySelectorAll('select, input[type="text"]').forEach(input => {
            input.addEventListener('change', () => {
                this.updateSetting(input.id, input.value);
            });
        });

        // Real-time updates for checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSetting(checkbox.id, checkbox.checked);
            });
        });

        // Handle radio button groups
        modal.querySelectorAll('.radio-buttons-group').forEach(group => {
            const radioButtons = group.querySelectorAll('.radio-button');
            radioButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const value = button.dataset.value;
                    const groupId = group.id.replace('-group', '');
                    
                    // Update visual state
                    radioButtons.forEach(rb => rb.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Update hidden radio input
                    const radioInput = button.querySelector('input[type="radio"]');
                    if (radioInput) {
                        radioInput.checked = true;
                    }
                    
                    // Update setting
                    this.updateSetting(groupId, value);
                });
            });
        });
    }

    // Save current form values
    saveCurrentSettings() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        // Save selects and text inputs
        modal.querySelectorAll('select, input[type="text"]').forEach(input => {
            if (input.value !== '') {
                this.settings[input.id] = input.value;
            }
        });

        // Save checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            this.settings[checkbox.id] = checkbox.checked;
        });

        // Save radio button groups
        modal.querySelectorAll('.radio-buttons-group').forEach(group => {
            const groupId = group.id.replace('-group', '');
            const checkedRadio = group.querySelector('input[type="radio"]:checked');
            if (checkedRadio) {
                this.settings[groupId] = checkedRadio.value;
            }
        });

        this.saveSettings();
    }

    // Update UI elements
    updateUI() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        // Update selects and text inputs
        modal.querySelectorAll('select, input[type="text"]').forEach(input => {
            if (this.settings[input.id] !== undefined) {
                input.value = this.settings[input.id];
            }
        });

        // Update checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (this.settings[checkbox.id] !== undefined) {
                checkbox.checked = this.settings[checkbox.id];
            }
        });

        // Update radio button groups
        modal.querySelectorAll('.radio-buttons-group').forEach(group => {
            const groupId = group.id.replace('-group', '');
            const currentValue = this.settings[groupId];
            
            if (currentValue !== undefined) {
                // Remove active from all buttons
                group.querySelectorAll('.radio-button').forEach(button => {
                    button.classList.remove('active');
                });
                
                // Add active to current value
                const activeButton = group.querySelector(`[data-value="${currentValue}"]`);
                if (activeButton) {
                    activeButton.classList.add('active');
                    const radioInput = activeButton.querySelector('input[type="radio"]');
                    if (radioInput) {
                        radioInput.checked = true;
                    }
                }
            }
        });
    }

    // Show settings modal
    showSettings() {
        this.createSettingsUI();
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('show');
            this.isVisible = true;
        }
    }

    // Hide settings modal
    hideSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.remove('show');
            this.isVisible = false;
        }
    }

    // Toggle settings visibility
    toggleSettings() {
        if (this.isVisible) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }
}
