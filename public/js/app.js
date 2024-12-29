document.addEventListener('DOMContentLoaded', () => {
    const dropBox = document.getElementById('dropBox');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadBtn = document.getElementById('uploadBtn');
    const modal = document.getElementById('errorModal');
    const retryBtn = document.getElementById('retryBtn');
    const modalImg = document.getElementById('modalImg');
    const modalText = document.getElementById('modalText');
    const previewWindow = document.getElementById('previewWindow');
    const filePreview = document.getElementById('filePreview');
    
    let filesArray = [];
    let failedFiles = [];

    // Handle drag-and-drop events
    dropBox.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropBox.classList.add('hover');
    });

    dropBox.addEventListener('dragleave', () => {
        dropBox.classList.remove('hover');
    });

    dropBox.addEventListener('drop', (event) => {
        event.preventDefault();
        dropBox.classList.remove('hover');
        handleFiles(event.dataTransfer.files);
    });

    // Handle click-to-upload
    dropBox.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // Handle files and update the list & preview
    function handleFiles(fileListInput) {
        filePreview.innerHTML = '';  // Clear previous previews
        for (let file of fileListInput) {
            filesArray.push(file);
            const listItem = document.createElement('li');
            listItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            fileList.appendChild(listItem);

            // Preview the file based on type
            const fileReader = new FileReader();
            fileReader.onload = function(event) {
                const fileType = file.type.split('/')[0];
                if (fileType === 'image') {
                    // Display image preview
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    filePreview.appendChild(img);
                } else if (fileType === 'video') {
                    // Display video preview
                    const video = document.createElement('video');
                    video.src = event.target.result;
                    video.controls = true;
                    filePreview.appendChild(video);
                } else if (fileType === 'audio') {
                    // Display audio preview
                    const audio = document.createElement('audio');
                    audio.src = event.target.result;
                    audio.controls = true;
                    filePreview.appendChild(audio);
                } else {
                    // Show file name for unsupported types
                    const fileName = document.createElement('p');
                    fileName.textContent = file.name;
                    filePreview.appendChild(fileName);
                }
            };
            fileReader.readAsDataURL(file);
        }
        uploadBtn.disabled = filesArray.length === 0;
        previewWindow.style.display = 'block';  // Show preview window
    }

    // Handle the upload button
    uploadBtn.addEventListener('click', () => {
        if (filesArray.length === 0) return;

        const formData = new FormData();
        filesArray.forEach((file) => {
            formData.append('files', file);
        });

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert('Files uploaded successfully!');
                    fileList.innerHTML = ''; // Clear the file list
                    filesArray = []; // Clear the files array
                    filePreview.innerHTML = ''; // Clear preview
                    uploadBtn.disabled = true; // Disable the button again
                    previewWindow.style.display = 'none'; // Hide preview window
                } else {
                    failedFiles = data.failedFiles;
                    showErrorModal('Some files failed to upload. Please try again.');
                }
            })
            .catch((error) => {
                console.error('Error uploading files:', error);
                showErrorModal('Error uploading files. Please try again.');
            });
    });

    // Retry failed uploads
    retryBtn.addEventListener('click', () => {
        if (failedFiles.length === 0) {
            closeErrorModal();
            return;
        }

        const retryFormData = new FormData();
        failedFiles.forEach((file) => {
            retryFormData.append('files', file);
        });

        fetch('/upload', {
            method: 'POST',
            body: retryFormData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert('Files retried successfully!');
                    closeErrorModal();
                } else {
                    showErrorModal('Retry failed. Please check your files.');
                }
            })
            .catch((error) => {
                console.error('Error retrying files:', error);
                showErrorModal('Error retrying files. Please try again.');
            });
    });

    // Show error modal
    function showErrorModal(message) {
        modalText.textContent = message;
        modal.style.display = 'block';
    }

    // Close error modal
    function closeErrorModal() {
        modal.style.display = 'none';
    }
});
