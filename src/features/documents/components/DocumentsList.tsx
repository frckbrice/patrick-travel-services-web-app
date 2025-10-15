'use client';

import { FileUploader } from '@/components/upload/FileUploader';
import { useTranslation } from 'react-i18next';

export function DocumentsList() {
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('documents.title')}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Upload and manage case-related documents
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h2 className="text-xl font-bold mb-4 dark:text-white">
                    {t('documents.upload')}
                </h2>
                <FileUploader
                    endpoint="documentUploader"
                    onUploadComplete={(files) => {
                        console.log('Uploaded files:', files);
                        // TODO: Save metadata to database via API
                    }}
                />
            </div>

            {/* Documents List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">
                        {t('documents.myDocuments')}
                    </h2>
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="text-lg">No documents uploaded yet</p>
                        <p className="text-sm mt-2">Upload your first document above</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

