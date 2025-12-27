// Cloudinary Upload Service
app.service('CloudinaryService', ['$http', '$q', function ($http, $q) {

    // Cloudinary config - Thay đổi theo config của bạn
    var CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload';
    var CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // Tạo unsigned upload preset trong Cloudinary dashboard

    /**
     * Upload ảnh lên Cloudinary
     * @param {File} file - File ảnh cần upload
     * @param {string} folder - Folder name trong Cloudinary (optional)
     * @returns {Promise} Promise với URL ảnh đã upload
     */
    this.uploadImage = function (file, folder) {
        var deferred = $q.defer();

        if (!file) {
            deferred.reject('No file provided');
            return deferred.promise;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            deferred.reject('File must be an image');
            return deferred.promise;
        }

        // Validate file size (max 10MB)
        var maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            deferred.reject('File size must be less than 10MB');
            return deferred.promise;
        }

        var formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        if (folder) {
            formData.append('folder', folder);
        }

        // Add timestamp to filename to avoid duplicates
        var timestamp = new Date().getTime();
        formData.append('public_id', 'delivery_proof_' + timestamp);

        $http.post(CLOUDINARY_URL, formData, {
            headers: { 'Content-Type': undefined }, // Let browser set content-type with boundary
            transformRequest: angular.identity
        })
            .then(function (response) {
                if (response.data && response.data.secure_url) {
                    deferred.resolve(response.data.secure_url);
                } else {
                    deferred.reject('Upload failed: No URL returned');
                }
            })
            .catch(function (error) {
                console.error('Cloudinary upload error:', error);
                deferred.reject('Upload failed: ' + (error.data && error.data.error && error.data.error.message || 'Unknown error'));
            });

        return deferred.promise;
    };

    /**
     * Upload ảnh từ base64
     * @param {string} base64Data - Base64 string của ảnh
     * @param {string} folder - Folder name trong Cloudinary (optional)
     * @returns {Promise} Promise với URL ảnh đã upload
     */
    this.uploadBase64 = function (base64Data, folder) {
        var deferred = $q.defer();

        if (!base64Data) {
            deferred.reject('No data provided');
            return deferred.promise;
        }

        var formData = new FormData();
        formData.append('file', base64Data);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        if (folder) {
            formData.append('folder', folder);
        }

        $http.post(CLOUDINARY_URL, formData, {
            headers: { 'Content-Type': undefined },
            transformRequest: angular.identity
        })
            .then(function (response) {
                if (response.data && response.data.secure_url) {
                    deferred.resolve(response.data.secure_url);
                } else {
                    deferred.reject('Upload failed: No URL returned');
                }
            })
            .catch(function (error) {
                console.error('Cloudinary upload error:', error);
                deferred.reject('Upload failed: ' + (error.data && error.data.error && error.data.error.message || 'Unknown error'));
            });

        return deferred.promise;
    };
}]);
