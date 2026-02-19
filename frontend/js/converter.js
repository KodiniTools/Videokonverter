(function () {
  'use strict';

  var API_URL = '/videokonverter';
  var WS_URL = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + '/videokonverter';
  var MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
  var ACCEPTED_EXTENSIONS = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ts'];

  var t = window.AppI18n.t;
  var jobs = [];
  var ws = null;
  var wsConnected = false;

  // ===== DOM References =====
  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('file-input');
  var uploadButton = document.getElementById('upload-button');
  var iconDefault = document.getElementById('upload-icon-default');
  var iconSpinner = document.getElementById('upload-icon-spinner');
  var dropZoneTitle = document.getElementById('drop-zone-title');
  var uploadError = document.getElementById('upload-error');
  var connectionStatus = document.getElementById('connection-status');
  var connectionText = document.getElementById('connection-text');
  var queueContainer = document.getElementById('conversion-queue');
  var queueList = document.getElementById('queue-list');

  // ===== WebSocket =====
  function connectWS() {
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = function () {
        wsConnected = true;
        connectionStatus.classList.add('connected');
        connectionText.textContent = t('connected');
        connectionText.setAttribute('data-i18n', 'connected');
      };

      ws.onmessage = function (event) {
        try {
          var data = JSON.parse(event.data);
          handleProgressUpdate(data);
        } catch (err) {
          // ignore parse errors
        }
      };

      ws.onerror = function () {
        // handled by onclose
      };

      ws.onclose = function () {
        wsConnected = false;
        connectionStatus.classList.remove('connected');
        connectionText.textContent = t('disconnected');
        connectionText.setAttribute('data-i18n', 'disconnected');
        ws = null;
        setTimeout(function () {
          if (!ws) connectWS();
        }, 3000);
      };
    } catch (err) {
      // retry
      setTimeout(connectWS, 3000);
    }
  }

  function handleProgressUpdate(update) {
    var job = findJob(update.jobId);
    if (!job) return;

    job.progress = update.progress;
    job.status = update.status;
    if (update.error) job.error = update.error;
    if (update.downloadUrl) job.downloadUrl = update.downloadUrl;
    if (update.convertedFileSize) job.convertedFileSize = update.convertedFileSize;

    renderJob(job);
  }

  // ===== Job Management =====
  function findJob(id) {
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) return jobs[i];
    }
    return null;
  }

  function removeJob(id) {
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) {
        jobs.splice(i, 1);
        break;
      }
    }
    var el = document.getElementById('job-' + id);
    if (el) el.remove();
    updateQueueVisibility();
  }

  function updateQueueVisibility() {
    queueContainer.style.display = jobs.length > 0 ? '' : 'none';
  }

  // ===== File Validation =====
  function isVideoFile(file) {
    if (file.type && file.type.startsWith('video/')) return true;
    var ext = file.name.split('.').pop();
    return ext ? ACCEPTED_EXTENSIONS.indexOf(ext.toLowerCase()) !== -1 : false;
  }

  // ===== Upload =====
  var isUploading = false;

  function setUploadingState(uploading) {
    isUploading = uploading;
    if (uploading) {
      dropZone.classList.add('uploading');
      uploadButton.classList.add('uploading');
      iconDefault.style.display = 'none';
      iconSpinner.style.display = '';
      dropZoneTitle.textContent = t('uploadingText');
      dropZoneTitle.setAttribute('data-i18n', 'uploadingText');
    } else {
      dropZone.classList.remove('uploading');
      uploadButton.classList.remove('uploading');
      iconDefault.style.display = '';
      iconSpinner.style.display = 'none';
      dropZoneTitle.textContent = t('dropFilesHere');
      dropZoneTitle.setAttribute('data-i18n', 'dropFilesHere');
    }
  }

  function uploadFile(file) {
    if (file.size > MAX_FILE_SIZE) {
      showError(t('fileTooLarge'));
      return;
    }

    var jobId = crypto.randomUUID();
    var job = {
      id: jobId,
      fileName: file.name,
      fileSize: file.size,
      sourceFormat: file.name.split('.').pop() || 'unknown',
      targetFormat: 'mp4',
      quality: 'high',
      status: 'uploading',
      progress: 0,
      error: null,
      downloadUrl: null,
      convertedFileSize: null,
      selectedFormat: 'mp4',
      selectedQuality: 'high'
    };

    jobs.push(job);
    updateQueueVisibility();
    renderJob(job);

    var formData = new FormData();
    formData.append('video', file);
    formData.append('jobId', jobId);
    formData.append('originalName', file.name);

    var xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function (e) {
      if (e.lengthComputable) {
        job.progress = Math.round((e.loaded / e.total) * 100);
        renderJob(job);
      }
    });

    xhr.addEventListener('load', function () {
      if (xhr.status === 200) {
        try {
          var response = JSON.parse(xhr.responseText);
          job.status = 'uploaded';
          job.progress = 100;
          job.uploadedFilePath = response.filePath;
        } catch (err) {
          job.status = 'error';
          job.error = t('uploadFailedError');
        }
      } else {
        job.status = 'error';
        job.error = t('uploadFailedError') + ': ' + xhr.status;
      }
      renderJob(job);
      checkAllUploadsComplete();
    });

    xhr.addEventListener('error', function () {
      job.status = 'error';
      job.error = t('uploadError');
      renderJob(job);
      checkAllUploadsComplete();
    });

    xhr.addEventListener('abort', function () {
      job.status = 'error';
      job.error = t('uploadAborted');
      renderJob(job);
      checkAllUploadsComplete();
    });

    xhr.open('POST', API_URL + '/api/upload');
    xhr.send(formData);
  }

  function checkAllUploadsComplete() {
    var stillUploading = false;
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].status === 'uploading') {
        stillUploading = true;
        break;
      }
    }
    if (!stillUploading) setUploadingState(false);
  }

  function processFiles(files) {
    hideError();
    setUploadingState(true);

    for (var i = 0; i < files.length; i++) {
      if (!isVideoFile(files[i])) {
        showError(files[i].name + ': ' + t('notVideoFile'));
        continue;
      }
      uploadFile(files[i]);
    }

    // If no valid files were found
    var hasUploading = false;
    for (var j = 0; j < jobs.length; j++) {
      if (jobs[j].status === 'uploading') { hasUploading = true; break; }
    }
    if (!hasUploading) setUploadingState(false);
  }

  // ===== Conversion =====
  function startConversion(jobId) {
    var job = findJob(jobId);
    if (!job || job.status !== 'uploaded') return;

    job.status = 'pending';
    job.targetFormat = job.selectedFormat;
    job.quality = job.selectedQuality;
    job.progress = 0;
    renderJob(job);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL + '/api/convert/' + jobId);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.addEventListener('load', function () {
      if (xhr.status === 200) {
        job.status = 'processing';
      } else {
        job.status = 'error';
        job.error = t('conversionFailed') + ': ' + xhr.status;
      }
      renderJob(job);
    });

    xhr.addEventListener('error', function () {
      job.status = 'error';
      job.error = t('conversionFailed');
      renderJob(job);
    });

    xhr.send(JSON.stringify({
      targetFormat: job.selectedFormat,
      quality: job.selectedQuality
    }));
  }

  // ===== Download =====
  function downloadFile(jobId) {
    var job = findJob(jobId);
    if (!job || !job.downloadUrl) return;

    var link = document.createElement('a');
    link.href = API_URL + job.downloadUrl;
    link.download = job.fileName.replace(/\.[^.]+$/, '') + '.' + job.targetFormat;
    link.click();
  }

  // ===== Rendering =====
  function formatFileSize(bytes) {
    var gb = bytes / 1024 / 1024 / 1024;
    return gb > 1
      ? gb.toFixed(2) + ' GB'
      : (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  function getStatusText(job) {
    switch (job.status) {
      case 'uploading': return t('statusUploading') + ' ' + job.progress + '%';
      case 'uploaded': return t('statusUploaded');
      case 'pending': return t('statusPending');
      case 'processing': return t('statusProcessing') + ' ' + job.progress + '%';
      case 'completed': return t('statusCompleted');
      case 'error': return t('statusError');
      default: return '';
    }
  }

  function getConvertedFileName(job) {
    return job.fileName.replace(/\.[^.]+$/, '') + '.' + job.targetFormat;
  }

  function renderJob(job) {
    var el = document.getElementById('job-' + job.id);
    if (!el) {
      el = document.createElement('div');
      el.id = 'job-' + job.id;
      el.className = 'conversion-item';
      queueList.appendChild(el);
    }

    var displayName = job.status === 'completed' ? getConvertedFileName(job) : job.fileName;
    var displaySize = job.status === 'completed' && job.convertedFileSize
      ? formatFileSize(job.convertedFileSize)
      : formatFileSize(job.fileSize);
    var showProgress = job.status === 'uploading' || job.status === 'pending' || job.status === 'processing';

    var html = '';

    // Header
    html += '<div class="item-header">';
    html += '<div class="file-info">';
    html += '<div class="file-name">' + escapeHtml(displayName) + '</div>';
    html += '<div class="file-meta">' + displaySize + '</div>';
    html += '</div>';
    html += '<div class="status status-' + job.status + '">' + getStatusText(job) + '</div>';
    html += '</div>';

    // Progress bar
    if (showProgress) {
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + job.progress + '%"></div></div>';
    }

    // Format selection (uploaded)
    if (job.status === 'uploaded') {
      html += '<div class="format-selection">';

      // Format row
      html += '<div class="selector-row"><label>' + t('formatLabel') + '</label>';
      html += '<div class="format-buttons">';
      var formats = [
        { value: 'mp4', label: 'MP4' },
        { value: 'webm', label: 'WebM' },
        { value: 'avi', label: 'AVI' },
        { value: 'mov', label: 'MOV' },
        { value: 'mkv', label: 'MKV' },
        { value: 'ts', label: 'TS' }
      ];
      for (var f = 0; f < formats.length; f++) {
        var fActive = job.selectedFormat === formats[f].value ? ' active' : '';
        html += '<button class="fmt-btn' + fActive + '" data-job="' + job.id + '" data-format="' + formats[f].value + '">' + formats[f].label + '</button>';
      }
      html += '</div></div>';

      // Quality row
      html += '<div class="selector-row"><label>' + t('qualityLabel') + '</label>';
      html += '<div class="format-buttons">';
      var qualities = [
        { value: 'low', key: 'qualityLow' },
        { value: 'medium', key: 'qualityMedium' },
        { value: 'high', key: 'qualityHigh' },
        { value: 'ultra', key: 'qualityUltra' }
      ];
      for (var q = 0; q < qualities.length; q++) {
        var qActive = job.selectedQuality === qualities[q].value ? ' active' : '';
        html += '<button class="qual-btn' + qActive + '" data-job="' + job.id + '" data-quality="' + qualities[q].value + '">' + t(qualities[q].key) + '</button>';
      }
      html += '</div></div>';

      html += '</div>';
    }

    // Error text
    if (job.error) {
      html += '<div class="error-text">' + escapeHtml(job.error) + '</div>';
    }

    // Action buttons
    html += '<div class="item-actions">';

    if (job.status === 'uploaded') {
      html += '<button class="btn-convert" data-action="convert" data-job="' + job.id + '">';
      html += '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html += t('convert');
      html += '</button>';
    }

    if (job.status === 'completed') {
      html += '<button class="btn-download" data-action="download" data-job="' + job.id + '">';
      html += '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-width="2" stroke-linecap="round"/></svg>';
      html += t('download');
      html += '</button>';
    }

    html += '<button class="btn-remove" data-action="remove" data-job="' + job.id + '">';
    html += '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/></svg>';
    html += t('remove');
    html += '</button>';

    html += '</div>';

    el.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Error Display =====
  function showError(msg) {
    uploadError.textContent = msg;
    uploadError.style.display = '';
  }

  function hideError() {
    uploadError.style.display = 'none';
    uploadError.textContent = '';
  }

  // ===== Event Handlers =====

  // Drag & Drop
  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  });

  // Click to browse
  dropZone.addEventListener('click', function () {
    if (!isUploading) fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length > 0) {
      processFiles(fileInput.files);
      fileInput.value = '';
    }
  });

  // Delegated click handler for job actions
  queueList.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;

    var jobId = btn.getAttribute('data-job');
    if (!jobId) return;

    var action = btn.getAttribute('data-action');
    var format = btn.getAttribute('data-format');
    var quality = btn.getAttribute('data-quality');

    if (action === 'convert') {
      startConversion(jobId);
    } else if (action === 'download') {
      downloadFile(jobId);
    } else if (action === 'remove') {
      removeJob(jobId);
    } else if (format) {
      var job = findJob(jobId);
      if (job) {
        job.selectedFormat = format;
        renderJob(job);
      }
    } else if (quality) {
      var qJob = findJob(jobId);
      if (qJob) {
        qJob.selectedQuality = quality;
        renderJob(qJob);
      }
    }
  });

  // ===== Initialize =====
  connectWS();
})();
