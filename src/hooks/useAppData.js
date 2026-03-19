import { useGoogleDriveDB } from './useGoogleDriveDB';

export function useAppData(userId, currentHandbookId) {
  const prefix = currentHandbookId ? `_${currentHandbookId}` : '';
  const isLoaded = !!currentHandbookId;

  return {
    handbooks: useGoogleDriveDB('handbooks', userId, true),
    homeroomStudents: useGoogleDriveDB(`students_homeroom${prefix}`, userId, isLoaded),
    subjectStudents: useGoogleDriveDB(`students_subject${prefix}`, userId, isLoaded),
    consultations: useGoogleDriveDB(`consultations${prefix}`, userId, isLoaded),
    todos: useGoogleDriveDB(`todos${prefix}`, userId, isLoaded),
    attendanceLog: useGoogleDriveDB(`attendance${prefix}`, userId, isLoaded),
    events: useGoogleDriveDB(`events${prefix}`, userId, isLoaded),
    lessonGroups: useGoogleDriveDB(`lesson_groups${prefix}`, userId, isLoaded),
    meetingLogs: useGoogleDriveDB(`meeting_logs${prefix}`, userId, isLoaded),
    myTimetable: useGoogleDriveDB(`my_timetable${prefix}`, userId, isLoaded),
    classPhotos: useGoogleDriveDB(`class_photos${prefix}`, userId, isLoaded),
    academicSchedule: useGoogleDriveDB(`academic_schedule${prefix}`, userId, isLoaded),
    educationPlans: useGoogleDriveDB(`education_plans${prefix}`, userId, isLoaded),
  };
}