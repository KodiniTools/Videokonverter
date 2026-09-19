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
    if (update.error) {
      job.error = update.error;
      job.errorKey = null;
      job.errorDetail = null;
    }
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

  // Remove a job from the browser only (local state + DOM).
  function removeJobLocal(id) {
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

  function removeJob(id) {
    removeJobLocal(id);

    // Also remove it on the server so it does not reappear after a page reload
    fetch(API_URL + '/api/jobs/' + id, { method: 'DELETE' })
      .then(function (res) {
        if (res.status === 404) {
          // The running backend predates DELETE /api/jobs/:id – the entry will
          // reappear after a reload until the backend is redeployed.
          console.warn('[Videokonverter] Backend does not support DELETE /api/jobs/:id – redeploy the backend (DEPLOY_WITH_BACKEND=1 ./deploy.sh).');
        }
      })
      .catch(function () {
        // network error – local removal already happened, ignore
      });
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
      errorKey: null,
      errorDetail: null,
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
          setJobError(job, 'uploadFailedError');
        }
      } else {
        job.status = 'error';
        setJobError(job, 'uploadFailedError', String(xhr.status));
      }
      renderJob(job);
      checkAllUploadsComplete();
    });

    xhr.addEventListener('error', function () {
      job.status = 'error';
      setJobError(job, 'uploadError');
      renderJob(job);
      checkAllUploadsComplete();
    });

    xhr.addEventListener('abort', function () {
      job.status = 'error';
      setJobError(job, 'uploadAborted');
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
        setJobError(job, 'conversionFailed', String(xhr.status));
      }
      renderJob(job);
    });

    xhr.addEventListener('error', function () {
      job.status = 'error';
      setJobError(job, 'conversionFailed');
      renderJob(job);
    });

    xhr.send(JSON.stringify({
      targetFormat: job.selectedFormat,
      quality: job.selectedQuality
    }));
  }

  // ===== Download =====
  var MIME_TYPES = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    ts: 'video/mp2t'
  };

  // Simple browser download – lands in the default download folder
  // (only asks for a location if the browser is configured to).
  function fallbackDownload(url, filename) {
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  }

  function downloadFile(jobId) {
    var job = findJob(jobId);
    if (!job || !job.downloadUrl) return;

    var suggestedName = job.fileName.replace(/\.[^.]+$/, '') + '.' + job.targetFormat;
    var url = API_URL + job.downloadUrl;

    // Modern browsers (Chrome/Edge): open a real "Save as" dialog so the user
    // can choose the file name and location. Must run in the click gesture,
    // so showSaveFilePicker() is called before any await.
    if (window.showSaveFilePicker) {
      var mime = MIME_TYPES[job.targetFormat] || 'application/octet-stream';
      var accept = {};
      accept[mime] = ['.' + job.targetFormat];

      window
        .showSaveFilePicker({
          suggestedName: suggestedName,
          types: [{ description: t('videoFileType'), accept: accept }]
        })
        .then(function (handle) {
          // Stream the file from the server straight to disk (no full copy in
          // memory – important for files up to 5 GB).
          return fetch(url).then(function (response) {
            if (!response.ok || !response.body) {
              throw new Error('HTTP ' + response.status);
            }
            return handle.createWritable().then(function (writable) {
              return response.body.pipeTo(writable);
            });
          });
        })
        .then(function () {
          // Saved successfully – the server removed the file after the download,
          // so drop the finished job from the queue too.
          removeJobLocal(jobId);
        })
        .catch(function (err) {
          // User cancelled the dialog – keep the job so they can retry.
          if (err && err.name === 'AbortError') return;
          showError(t('downloadError'));
        });
      return;
    }

    // Fallback (Firefox/Safari): trigger a normal browser download.
    fallbackDownload(url, suggestedName);
    removeJobLocal(jobId);
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

  // Client-side errors are stored as translation key + optional detail so
  // they can be re-rendered when the locale changes. Server errors arrive as
  // plain text in job.error.
  function setJobError(job, key, detail) {
    job.errorKey = key;
    job.errorDetail = detail || null;
    job.error = null;
  }

  function getErrorText(job) {
    if (job.errorKey) {
      return t(job.errorKey) + (job.errorDetail ? ': ' + job.errorDetail : '');
    }
    return job.error || '';
  }

  function renderAllJobs() {
    for (var i = 0; i < jobs.length; i++) {
      renderJob(jobs[i]);
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

    // Clear existing content
    while (el.firstChild) el.removeChild(el.firstChild);

    // Header
    var header = document.createElement('div');
    header.className = 'item-header';

    var fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    var fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = displayName;

    var fileMeta = document.createElement('div');
    fileMeta.className = 'file-meta';
    fileMeta.textContent = displaySize;

    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);

    var statusEl = document.createElement('div');
    statusEl.className = 'status status-' + job.status;
    statusEl.textContent = getStatusText(job);

    header.appendChild(fileInfo);
    header.appendChild(statusEl);
    el.appendChild(header);

    // Progress bar
    if (showProgress) {
      var progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      var progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = job.progress + '%';
      progressBar.appendChild(progressFill);
      el.appendChild(progressBar);
    }

    // Format selection (uploaded)
    if (job.status === 'uploaded') {
      var formatSelection = document.createElement('div');
      formatSelection.className = 'format-selection';

      // Format row
      var formatRow = document.createElement('div');
      formatRow.className = 'selector-row';

      var formatLabel = document.createElement('label');
      formatLabel.textContent = t('formatLabel');
      formatRow.appendChild(formatLabel);

      var formatButtons = document.createElement('div');
      formatButtons.className = 'format-buttons';

      var formats = [
        { value: 'mp4', label: 'MP4' },
        { value: 'webm', label: 'WebM' },
        { value: 'avi', label: 'AVI' },
        { value: 'mov', label: 'MOV' },
        { value: 'mkv', label: 'MKV' },
        { value: 'ts', label: 'TS' }
      ];
      for (var f = 0; f < formats.length; f++) {
        var fBtn = document.createElement('button');
        fBtn.className = 'fmt-btn' + (job.selectedFormat === formats[f].value ? ' active' : '');
        fBtn.dataset.job = job.id;
        fBtn.dataset.format = formats[f].value;
        fBtn.textContent = formats[f].label;
        formatButtons.appendChild(fBtn);
      }
      formatRow.appendChild(formatButtons);
      formatSelection.appendChild(formatRow);

      // Quality row
      var qualityRow = document.createElement('div');
      qualityRow.className = 'selector-row';

      var qualityLabel = document.createElement('label');
      qualityLabel.textContent = t('qualityLabel');
      qualityRow.appendChild(qualityLabel);

      var qualityButtons = document.createElement('div');
      qualityButtons.className = 'format-buttons';

      var qualities = [
        { value: 'low', key: 'qualityLow' },
        { value: 'medium', key: 'qualityMedium' },
        { value: 'high', key: 'qualityHigh' },
        { value: 'ultra', key: 'qualityUltra' }
      ];
      for (var q = 0; q < qualities.length; q++) {
        var qBtn = document.createElement('button');
        qBtn.className = 'qual-btn' + (job.selectedQuality === qualities[q].value ? ' active' : '');
        qBtn.dataset.job = job.id;
        qBtn.dataset.quality = qualities[q].value;
        qBtn.textContent = t(qualities[q].key);
        qualityButtons.appendChild(qBtn);
      }
      qualityRow.appendChild(qualityButtons);
      formatSelection.appendChild(qualityRow);

      el.appendChild(formatSelection);
    }

    // Error text
    var errorText = getErrorText(job);
    if (errorText) {
      var errorEl = document.createElement('div');
      errorEl.className = 'error-text';
      errorEl.textContent = errorText;
      el.appendChild(errorEl);
    }

    // Action buttons
    var actions = document.createElement('div');
    actions.className = 'item-actions';

    if (job.status === 'uploaded') {
      var convertBtn = document.createElement('button');
      convertBtn.className = 'btn-convert';
      convertBtn.dataset.action = 'convert';
      convertBtn.dataset.job = job.id;
      var convertSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      convertSvg.setAttribute('class', 'btn-icon');
      convertSvg.setAttribute('viewBox', '0 0 24 24');
      convertSvg.setAttribute('fill', 'none');
      convertSvg.setAttribute('stroke', 'currentColor');
      var convertPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      convertPath.setAttribute('d', 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z');
      convertPath.setAttribute('stroke-width', '2');
      convertPath.setAttribute('stroke-linecap', 'round');
      convertPath.setAttribute('stroke-linejoin', 'round');
      convertSvg.appendChild(convertPath);
      convertBtn.appendChild(convertSvg);
      convertBtn.appendChild(document.createTextNode(t('convert')));
      actions.appendChild(convertBtn);
    }

    if (job.status === 'completed') {
      var downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn-download';
      downloadBtn.dataset.action = 'download';
      downloadBtn.dataset.job = job.id;
      var downloadSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      downloadSvg.setAttribute('class', 'btn-icon');
      downloadSvg.setAttribute('viewBox', '0 0 24 24');
      downloadSvg.setAttribute('fill', 'none');
      downloadSvg.setAttribute('stroke', 'currentColor');
      var downloadPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      downloadPath.setAttribute('d', 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3');
      downloadPath.setAttribute('stroke-width', '2');
      downloadPath.setAttribute('stroke-linecap', 'round');
      downloadSvg.appendChild(downloadPath);
      downloadBtn.appendChild(downloadSvg);
      downloadBtn.appendChild(document.createTextNode(t('download')));
      actions.appendChild(downloadBtn);
    }

    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.dataset.action = 'remove';
    removeBtn.dataset.job = job.id;
    var removeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    removeSvg.setAttribute('class', 'btn-icon');
    removeSvg.setAttribute('viewBox', '0 0 24 24');
    removeSvg.setAttribute('fill', 'none');
    removeSvg.setAttribute('stroke', 'currentColor');
    var removePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    removePath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
    removePath.setAttribute('stroke-width', '2');
    removePath.setAttribute('stroke-linecap', 'round');
    removeSvg.appendChild(removePath);
    removeBtn.appendChild(removeSvg);
    removeBtn.appendChild(document.createTextNode(t('remove')));
    actions.appendChild(removeBtn);

    el.appendChild(actions);
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

  // Re-render the queue when the language changes (the nav dispatches
  // 'locale-changed', i18n.js applies it and then fires 'i18n-applied').
  window.addEventListener('i18n-applied', renderAllJobs);

  // ===== Initialize =====
  connectWS();

  async function restoreJobsFromServer() {
    try {
      var res = await fetch(API_URL + '/api/jobs');
      if (!res.ok) return;
      var data = await res.json();
      for (var i = 0; i < data.jobs.length; i++) {
        var serverJob = data.jobs[i];
        if (findJob(serverJob.jobId)) continue; // already tracked
        var isCompleted = serverJob.status === 'completed';
        var job = {
          id: serverJob.jobId,
          fileName: serverJob.originalName,
          fileSize: serverJob.fileSize || 0,
          sourceFormat: serverJob.originalName.split('.').pop() || '',
          targetFormat: serverJob.format || 'mp4',
          quality: 'high',
          status: serverJob.status,
          progress: isCompleted ? 100 : serverJob.status === 'processing' ? 50 : 0,
          error: null,
          errorKey: null,
          errorDetail: null,
          downloadUrl: isCompleted ? serverJob.downloadUrl || '/api/download/' + serverJob.jobId : null,
          convertedFileSize: isCompleted ? serverJob.convertedFileSize || null : null,
          selectedFormat: serverJob.format || 'mp4',
          selectedQuality: 'high',
        };
        jobs.push(job);
        renderJob(job);
      }
      updateQueueVisibility();
    } catch (e) {
      // server not available, ignore
    }
  }

  restoreJobsFromServer();
})();
