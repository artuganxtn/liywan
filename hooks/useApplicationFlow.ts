import { useState, useCallback } from 'react';
import { applications, upload } from '../services/api';

export interface ApplicationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  experience: string;
  location: string;
  nationality: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  height?: string;
  weight?: string;
  shirtSize?: string;
  qidNumber?: string;
  languages?: string[];
  photoFile?: File;
  cvFile?: File;
  idFile?: File;
  quizAnswers?: number[];
  quizScore?: number;
  quizDetails?: any[];
}

export function useApplicationFlow() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submitApplication = useCallback(async (data: ApplicationData) => {
    setIsSubmitting(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Prepare application data (10%)
      setProgress(10);
      const applicationData: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        roleApplied: data.role,
        experience: data.experience,
        location: data.location,
        nationality: data.nationality,
        dob: data.dob ? new Date(data.dob).toISOString() : undefined,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        shirtSize: data.shirtSize,
        qidNumber: data.qidNumber || '',
        languages: data.languages || [],
        quizScore: data.quizScore,
        quizDetails: data.quizDetails,
        avatar: `https://i.pravatar.cc/150?u=${data.name}`,
      };

      // Step 2: Upload files (30-70%)
      const uploadPromises: Promise<void>[] = [];
      let uploadProgress = 30;

      if (data.photoFile) {
        uploadPromises.push(
          upload.single(data.photoFile, {
            onUploadProgress: (p) => {
              setProgress(uploadProgress + (p * 0.15));
            },
          })
            .then((res) => {
              if (res.success && res.data?.url) {
                applicationData.avatar = res.data.url;
              }
              uploadProgress += 15;
            })
            .catch((err) => console.error('Photo upload error:', err))
        );
      }

      if (data.cvFile) {
        uploadPromises.push(
          upload.single(data.cvFile, {
            onUploadProgress: (p) => {
              setProgress(uploadProgress + (p * 0.15));
            },
          })
            .then((res) => {
              if (res.success && res.data?.url) {
                applicationData.cvUrl = res.data.url;
              }
              uploadProgress += 15;
            })
            .catch((err) => console.error('CV upload error:', err))
        );
      }

      if (data.idFile) {
        uploadPromises.push(
          upload.single(data.idFile, {
            onUploadProgress: (p) => {
              setProgress(uploadProgress + (p * 0.15));
            },
          })
            .then((res) => {
              if (res.success && res.data?.url) {
                applicationData.idDocumentUrl = res.data.url;
              }
              uploadProgress += 15;
            })
            .catch((err) => console.error('ID upload error:', err))
        );
      }

      await Promise.all(uploadPromises);
      setProgress(75);

      // Step 3: Submit application (75-100%)
      const response = await applications.create(applicationData);
      setProgress(100);

      // Handle response
      let responseAppData = null;
      if (response?.success && response.data) {
        responseAppData = response.data;
      } else if (response?._id) {
        responseAppData = response;
      } else if (response?.data?._id) {
        responseAppData = response.data;
      }

      if (responseAppData || response?.success) {
        return {
          success: true,
          data: responseAppData,
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return {
    submitApplication,
    isSubmitting,
    progress,
    error,
  };
}

