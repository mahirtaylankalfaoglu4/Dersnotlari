import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "monthlyLessonScheduler";
const MONTHLY_FREE_DAY = "Boş Zaman";
const LOCATIONS = ["EV", "KEMALPAŞA"];

// Saatler: 8:00, 8:30 ... 20:30, 21:00
const HOURS = [];
for (let h = 8; h <= 20; h++) {
  HOURS.push(`${h}:00`);
  HOURS.push(`${h}:30`);
}
HOURS.push("21:00");

// Gün başlıkları Pazartesi ile başlıyor
const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const hourToKey = (hourStr) => hourStr.replace(":", "_");
const keyToHour = (key) => key.replace("_", ":");

const MonthlyLessonScheduler = () => {
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.students || [
          'E Öykü', 'Güneş M', 'Asya A', 'Mila B', 'Duru B', 'Eda', 'Erva', 'Rengin',
          'Miray', 'Toprak A', 'Erva K', 'İpek', 'Güneş O', 'Ecrin S', 'Ulaş Y', 'Ayşe Hanım', MONTHLY_FREE_DAY
        ];
      } catch {}
    }
    return [
      'E Öykü', 'Güneş M', 'Asya A', 'Mila B', 'Duru B', 'Eda', 'Erva', 'Rengin',
      'Miray', 'Toprak A', 'Erva K', 'İpek', 'Güneş O', 'Ecrin S', 'Ulaş Y', 'Ayşe Hanım', MONTHLY_FREE_DAY
    ];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState('');
  const [hourToAssign, setHourToAssign] = useState('');
  const [locationToAssign, setLocationToAssign] = useState(LOCATIONS[0]);
  const [selectedHour, setSelectedHour] = useState(null);

  const [monthlySchedule, setMonthlySchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.monthlySchedule || {};
      } catch {}
    }
    return {};
  });

  const [studentLessonCounts, setStudentLessonCounts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.studentLessonCounts || {};
      } catch {}
    }
    const counts = {};
    students.forEach(student => {
      counts[student] = 0;
    });
    return counts;
  });

  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  // const [dayClickCounts, setDayClickCounts] = useState({});  // KALDIRILDI
  // Öğrenci ekleme için
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  // Öğrenci detay kartı için
  const [selectedStudentForPanel, setSelectedStudentForPanel] = useState(null);

  // Tatil için seçilen saat
  const [vacationHour, setVacationHour] = useState(null); // örnek: "13:00"

  // Ay/gün anahtarını üret
  const getDateKey = (dateObj, day) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    return `${year}-${month}-${day}`;
  };

  // Ay takvimi için eksik günleri schedule'a ekle (her geçişte veya ilk açılışta)
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month}-${day}`;
        if (!newSchedule[dateKey]) {
          newSchedule[dateKey] = {};
          for (let h = 0; h < HOURS.length; h++) {
            newSchedule[dateKey][hourToKey(HOURS[h])] = {
              student: '',
              isCompleted: false,
              isFixed: false,
              lessonCount: 0,
              location: ''
            };
          }
          // Salı günü için sabit ders ekle
          const date = new Date(year, month, day);
          if (date.getDay() === 2) {
            newSchedule[dateKey][hourToKey("11:00")] = {
              student: 'Ayşe',
              isCompleted: false,
              isFixed: true,
              lessonCount: 1,
              location: LOCATIONS[0]
            };
          }
        }
      }
      return newSchedule;
    });
    // eslint-disable-next-line
  }, [currentDate]);

  // LocalStorage'dan ilk yükleme
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMonthlySchedule(parsed.monthlySchedule || {});
        setStudentLessonCounts(parsed.studentLessonCounts || {});
        if (parsed.students) setStudents(parsed.students);
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  // Pazartesi başlayan takvim grid dizilimi (hafta başı Pazartesi)
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay(); // 0: Pazar, 1: Pazartesi, ...
    // Haftanın ilk günü Pazartesi olacak şekilde kaydır
    startDayOfWeek = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDay(null);
    setSelectedHour(null);
    setShowAssignPanel(false);
    setVacationHour(null);
  };

  // Seçili güne tıklayınca sadece öğrenci-saat-mekan seçme paneli gelsin
  const selectDay = (day) => {
    if (!day) return;
    setSelectedDay(day);
    setShowAssignPanel(true);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
    setSelectedHour(null);
    setVacationHour(null);
  };

  // Güne tıklama
  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
    setShowAssignPanel(true);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
    setSelectedHour(null);
    setVacationHour(null);
    // Artık herhangi bir otomatik sıfırlama yok!
  };

  // Atama paneli: öğrenci, saat, mekan
  const handleAssign = () => {
    if (!studentToAssign || !hourToAssign || !selectedDay || !locationToAssign) return;
    const dateKey = getDateKey(currentDate, selectedDay);
    const hKey = hourToKey(hourToAssign);
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      if (!newSchedule[dateKey]) newSchedule[dateKey] = {};
      newSchedule[dateKey][hKey] = {
        student: studentToAssign,
        isCompleted: false,
        isFixed: false,
        lessonCount: 1,
        location: locationToAssign
      };
      return newSchedule;
    });
    setShowAssignPanel(false);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
    setVacationHour(null);
  };

  // Tatil butonu: seçili güne ve seçili saate "Boş Zaman" atanır ve vacationHour state'i güncellenir
  const handleVacation = () => {
    if (!selectedDay || !hourToAssign) return;
    const dateKey = getDateKey(currentDate, selectedDay);
    const hKey = hourToKey(hourToAssign);
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hKey] = {
        student: MONTHLY_FREE_DAY,
        isCompleted: false,
        isFixed: false,
        lessonCount: 0,
        location: ''
      };
      return newSchedule;
    });
    setVacationHour(hourToAssign);
    setShowAssignPanel(false);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
  };

  // Günlük ders çizimi
  const getDaySchedule = () => {
    if (!selectedDay) return [];
    const dateKey = getDateKey(currentDate, selectedDay);
    const daySchedule = monthlySchedule[dateKey] || {};
    return HOURS.map(h => {
      const hKey = hourToKey(h);
      return {
        hour: h,
        ...daySchedule[hKey]
      };
    });
  };

  // Öğrencinin o ayki tamamlanan ders sayısı
  const getStudentLessonCount = (studentName) => {
    let count = 0;
    Object.entries(monthlySchedule).forEach(([dateKey, hoursObj]) => {
      if (dateKey.startsWith(`${currentDate.getFullYear()}-${currentDate.getMonth()}-`)) {
        Object.values(hoursObj).forEach(slot => {
          if (slot.student === studentName && slot.isCompleted) count++;
        });
      }
    });
    return count;
  };

  // Slot "kırmızı" mı? Bu slotta atanmış öğrenci o ay 3 ders tamamladıysa ve bu slot henüz tamamlanmadıysa
  const isFourthLesson = (studentName, isCompleted) => {
    if (!studentName || studentName === MONTHLY_FREE_DAY) return false;
    const count = getStudentLessonCount(studentName);
    return count === 3 && !isCompleted;
  };

  // Saat kutusuna tıklayınca dersi tamamla (görsel güncelleme)
  const handleHourClick = (hour) => {
    if (!selectedDay) return;
    const dateKey = getDateKey(currentDate, selectedDay);
    const hKey = hourToKey(hour);
    const cell = (monthlySchedule[dateKey] && monthlySchedule[dateKey][hKey]) || {};
    if (cell.student && !cell.isCompleted) {
      setMonthlySchedule(prev => {
        const newSchedule = { ...prev };
        newSchedule[dateKey][hKey].isCompleted = true;
        return newSchedule;
      });
      setSelectedHour(hour);
    } else {
      setSelectedHour(hour);
    }
  };

  // Sil butonları
  const handleFreeTimeAction = (dateKey, hour) => {
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hourToKey(hour)] = {
        student: '',
        isCompleted: false,
        isFixed: false,
        lessonCount: 0,
        location: ''
      };
      return newSchedule;
    });
  };
  const handleStudentTimeDelete = (dateKey, hour) => {
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hourToKey(hour)] = {
        student: '',
        isCompleted: false,
        isFixed: false,
        lessonCount: 0,
        location: ''
      };
      return newSchedule;
    });
  };

  // Edit (çift tık) kutusu
  const handleDoubleClick = (hour) => {
    if (!selectedDay) return;
    const dateKey = getDateKey(currentDate, selectedDay);
    const hKey = hourToKey(hour);
    const cell = (monthlySchedule[dateKey] && monthlySchedule[dateKey][hKey]) || {};
    if (!cell.isFixed) {
      setEditingCell({ day: selectedDay, hour });
      setEditValue(cell.student);
    }
  };
  const saveEdit = () => {
    if (editingCell && selectedDay) {
      const dateKey = getDateKey(currentDate, selectedDay);
      setMonthlySchedule(prev => {
        const newSchedule = { ...prev };
        newSchedule[dateKey][hourToKey(editingCell.hour)] = {
          ...newSchedule[dateKey][hourToKey(editingCell.hour)],
          student: editValue,
          isCompleted: false
        };
        return newSchedule;
      });
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Otomatik atama: Her öğrenciden ayda birer tane boş slot varsa ders ata
  const autoAssignLessons = () => {
    setMonthlySchedule(prevSchedule => {
      const newSchedule = { ...prevSchedule };
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const emptySlots = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month}-${day}`;
        for (let h = 0; h < HOURS.length; h++) {
          const hKey = hourToKey(HOURS[h]);
          if (!newSchedule[dateKey][hKey].student) {
            emptySlots.push({ dateKey, day, hour: HOURS[h] });
          }
        }
      }

      let slotIndex = 0;
      students.forEach(student => {
        if (student !== MONTHLY_FREE_DAY && (studentLessonCounts[student] || 0) < 1 && slotIndex < emptySlots.length) {
          const slot = emptySlots[slotIndex];
          newSchedule[slot.dateKey][hourToKey(slot.hour)] = {
            student,
            isCompleted: false,
            isFixed: false,
            lessonCount: 1,
            location: LOCATIONS[0]
          };
          slotIndex++;
        }
      });

      return newSchedule;
    });
  };

  // GÜNÜN HERHANGİ BİR SAATİNDE "Boş Zaman" varsa o gün tatil günü olarak kabul edilir
  const getFreeDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const freeDays = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const daySchedule = monthlySchedule[dateKey];
      if (daySchedule) {
        const isHoliday = Object.values(daySchedule).some(slot => slot.student === MONTHLY_FREE_DAY);
        if (isHoliday) freeDays.push(day);
      }
    }
    return freeDays;
  };

  // Ay genel istatistikleri
  const getMonthStats = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let totalLessons = 0;
    let completedLessons = 0;
    let freeSlots = 0;
    let holidayCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const daySchedule = monthlySchedule[dateKey];
      if (daySchedule) {
        let isHoliday = false;
        Object.values(daySchedule).forEach(slot => {
          if (slot.student) {
            totalLessons++;
            if (slot.isCompleted) completedLessons++;
            if (slot.student === MONTHLY_FREE_DAY) isHoliday = true;
          } else {
            freeSlots++;
          }
        });
        if (isHoliday) holidayCount++;
      }
    }

    return { totalLessons, completedLessons, freeSlots, holidayCount };
  };

  // Öğrenci detayları
  const getStudentLessonsDetail = (studentName) => {
    const lessons = [];
    Object.entries(monthlySchedule).forEach(([dateKey, hoursObj]) => {
      Object.entries(hoursObj).forEach(([hour, slot]) => {
        if (
          slot.student === studentName &&
          slot.isCompleted // sadece tamamlanan dersler
        ) {
          const [year, month, day] = dateKey.split('-');
          lessons.push({
            date: `${day.padStart(2, '0')}.${(parseInt(month, 10) + 1)
              .toString()
              .padStart(2, '0')}.${year}`,
            hour: keyToHour(hour),
            location: slot.location || ''
          });
        }
      });
    });
    return lessons.sort((a, b) => {
      if (a.date === b.date) return a.hour.localeCompare(b.hour);
      return a.date.localeCompare(b.date);
    });
  };

  // Öğrenci ekle/sil
  const handleAddStudent = () => {
    const name = newStudentName.trim();
    if (!name || students.includes(name) || name === MONTHLY_FREE_DAY) return;
    setStudents(prev => [...prev, name]);
    setStudentLessonCounts(counts => ({ ...counts, [name]: 0 }));
    setNewStudentName('');
    setShowAddStudent(false);
  };
  const handleDeleteStudent = (name) => {
    if (name === MONTHLY_FREE_DAY) return;
    if (!window.confirm(`"${name}" adlı öğrenciyi silmek istiyor musunuz? Bu öğrenci programdan da silinir!`)) return;
    setStudents(students.filter(s => s !== name));
    setStudentLessonCounts(counts => {
      const { [name]: _, ...rest } = counts;
      return rest;
    });
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach(dateKey => {
        Object.keys(newSchedule[dateKey]).forEach(hour => {
          if (newSchedule[dateKey][hour].student === name) {
            newSchedule[dateKey][hour] = {
              student: '',
              isCompleted: false,
              isFixed: false,
              lessonCount: 0,
              location: ''
            };
          }
        });
      });
      return newSchedule;
    });
  };

  // KAYDET
  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        monthlySchedule,
        studentLessonCounts,
        students,
      })
    );
    alert("Program kaydedildi!");
  };

  const days = getDaysInMonth();
  const stats = getMonthStats();
  const freeDays = getFreeDays();

  // Takvim renkleri: kırmızı sadece slot için, gün kutusuna asla yansımaz.
  const getDayColor = (day) => {
    if (!day) return '';
    const dateKey = getDateKey(currentDate, day);
    const daySchedule = monthlySchedule[dateKey];
    if (!daySchedule) return '';
    const hasBoşZaman = Object.values(daySchedule).some(slot => slot.student === MONTHLY_FREE_DAY);
    const hasCompletedOther = Object.values(daySchedule).some(slot => slot.student && slot.isCompleted && slot.student !== MONTHLY_FREE_DAY);
    if (hasBoşZaman) return 'bg-yellow-200 border-yellow-400';
    if (hasCompletedOther) return 'bg-green-200 border-green-400';
    return '';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-2 bg-gray-50 min-h-screen overflow-auto">
      {/* Sol Panel - Takvim */}
      <div className="flex flex-col flex-shrink-0 w-full lg:w-[420px]">
        <div className="flex items-center justify-between mb-2 bg-white p-2 rounded-lg border-2 border-gray-300">
          <button
            onClick={() => changeMonth(-1)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            ←
          </button>
          <h2 className="text-base font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            →
          </button>
        </div>
        <button
          className="mb-2 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 w-full"
          onClick={() => setShowAddStudent(true)}
        >
          Yeni Öğrenci Ekle
        </button>
        {showAddStudent && (
          <div className="mb-2 p-2 border rounded bg-gray-100">
            <input
              type="text"
              className="w-full p-1 rounded border text-xs mb-2"
              placeholder="Öğrenci adı"
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddStudent();
              }}
              autoFocus
            />
            <button
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2 text-xs"
              onClick={handleAddStudent}
            >
              Ekle
            </button>
            <button
              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
              onClick={() => {
                setShowAddStudent(false);
                setNewStudentName('');
              }}
            >
              İptal
            </button>
          </div>
        )}

        <div className="w-full max-w-[410px] min-h-[250px] h-[400px] bg-white border-2 border-gray-300 rounded-lg overflow-auto">
          <div className="grid grid-cols-7 h-full">
            {dayNames.map(dayName => (
              <div key={dayName} className="bg-blue-100 border-r border-b border-gray-300 flex items-center justify-center font-bold text-xs sm:text-sm py-2">
                {dayName}
              </div>
            ))}
            {days.map((day, index) => {
              return (
                <div
                  key={index}
                  className={`border-r border-b border-gray-300 p-1 cursor-pointer relative
                    ${day ? 'hover:bg-blue-50' : 'bg-gray-100'}
                    ${selectedDay === day ? 'ring-2 ring-blue-400' : ''}
                    ${day ? 'flex flex-col items-center justify-center' : ''}
                    ${getDayColor(day)}`}
                  onClick={() => handleDayClick(day)}
                >
                  {day && (
                    <>
                      <span className="font-semibold text-xs sm:text-sm">{day}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orta Panel - Günlük Saat Programı ve Atama Paneli */}
      <div className="w-full lg:w-[340px] bg-white border-2 border-gray-300 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-auto min-h-[340px]">
        {showAssignPanel && (
          <div className="mb-4 p-2 border rounded bg-gray-100">
            <div className="mb-2">
              <label className="block mb-1 text-xs">Öğrenci:</label>
              <select
                className="w-full p-1 rounded border text-xs"
                value={studentToAssign}
                onChange={e => setStudentToAssign(e.target.value)}
              >
                <option value="">Öğrenci seçin</option>
                {students.filter(s => s !== MONTHLY_FREE_DAY).map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-xs">Saat:</label>
              <select
                className="w-full p-1 rounded border text-xs"
                value={hourToAssign}
                onChange={e => setHourToAssign(e.target.value)}
              >
                <option value="">Saat seçin</option>
                {HOURS.map(hour => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-xs">Ders Yeri:</label>
              <select
                className="w-full p-1 rounded border text-xs"
                value={locationToAssign}
                onChange={e => setLocationToAssign(e.target.value)}
              >
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                onClick={handleAssign}
              >
                Ata
              </button>
              <button
                className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs"
                onClick={handleVacation}
                disabled={!hourToAssign}
                style={{ opacity: hourToAssign ? 1 : 0.6 }}
              >
                Tatil
              </button>
              <button
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                onClick={() => setShowAssignPanel(false)}
              >
                İptal
              </button>
            </div>
          </div>
        )}
        {selectedDay && (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {getDaySchedule().map(({ hour, student, isCompleted, isFixed, location }, idx) => {
              const dateKey = getDateKey(currentDate, selectedDay);
              const isHoliday = student === MONTHLY_FREE_DAY;
              const redCol = student && isFourthLesson(student, isCompleted);
              const isEditing = editingCell?.hour === hour;
              // Tatil atanmış saat: vacationHour === hour
              const isVacationBar = vacationHour === hour;
              return (
                <div
                  key={idx}
                  className={`p-2 border rounded cursor-pointer text-xs sm:text-sm flex items-center justify-between
                  ${isVacationBar ? 'bg-yellow-300' : isCompleted && !isHoliday ? 'bg-green-200' : redCol ? 'bg-red-300' : isHoliday ? 'bg-yellow-200' : 'bg-white'}
                  ${isFixed ? 'ring-2 ring-blue-400' : ''}
                  ${selectedHour === hour ? 'border-blue-500' : 'border-gray-300'}
                  hover:bg-gray-50`}
                  onClick={() => handleHourClick(hour)}
                  onDoubleClick={() => handleDoubleClick(hour)}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{hour}</span>
                      {isFixed && <span className="text-blue-500 text-xs">Sabit</span>}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                        className="w-full mt-1 text-xs bg-transparent border-none outline-none"
                        autoFocus
                      />
                    ) : (
                      <div className="text-xs mt-1 flex items-center">
                        {student || 'Boş'}
                        {location && <span className="px-1 py-0.5 bg-gray-200 rounded ml-1">{location}</span>}
                        {isHoliday && (
                          <button
                            className="ml-2 px-2 py-1 bg-red-400 text-white rounded text-[10px] hover:bg-red-600"
                            title='"Boş Zaman"ı sil veya başka bir şey ekle'
                            onClick={e => {
                              e.stopPropagation();
                              handleFreeTimeAction(dateKey, hour);
                            }}
                          >
                            Sil
                          </button>
                        )}
                        {!isHoliday && student && !isFixed && (
                          <button
                            className="ml-2 px-2 py-1 bg-red-400 text-white rounded text-[10px] hover:bg-red-600"
                            title="Öğrenci saatini sil"
                            onClick={e => {
                              e.stopPropagation();
                              handleStudentTimeDelete(dateKey, hour);
                            }}
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sağ Panel - İstatistikler, Kontroller ve Öğrenci Detay Pano */}
      <div className="flex flex-col gap-4 w-full lg:w-[320px] flex-shrink-0">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-3 flex flex-col overflow-auto min-h-[320px]">
          <h3 className="font-bold text-base mb-3">Aylık Özet</h3>
          <button
            onClick={autoAssignLessons}
            className="w-full mb-2 px-3 py-2 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Otomatik Ders Ata
          </button>
          <button
            onClick={handleSave}
            className="w-full mb-3 px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            KAYDET
          </button>
          {/* ... İstatistik, tatil günleri, öğrenci durumu, açıklamalar ... */}
          <div className="mb-3 bg-gray-50 p-2 rounded">
            <h4 className="font-semibold mb-2 text-sm">Ay İstatistikleri</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Toplam Ders:</span>
                <span className="font-medium">{stats.totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span>Tamamlanan:</span>
                <span className="font-medium text-green-600">{stats.completedLessons}</span>
              </div>
              <div className="flex justify-between">
                <span>Boş Saat:</span>
                <span className="font-medium text-blue-600">{stats.freeSlots}</span>
              </div>
              <div className="flex justify-between">
                <span>Tatil Günü:</span>
                <span className="font-medium text-yellow-600">{stats.holidayCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Tamamlanma:</span>
                <span className="font-medium">
                  {stats.totalLessons > 0 ? Math.round((stats.completedLessons/stats.totalLessons)*100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="mb-3">
            <h4 className="font-semibold mb-2 text-sm">Tatil Günlerim</h4>
            <div className="flex flex-wrap gap-2">
              {freeDays.length === 0 && <span className="text-xs text-gray-500">Henüz seçilmedi</span>}
              {freeDays.map(day => (
                <div key={day} className="w-8 h-8 rounded bg-yellow-200 border-2 border-yellow-400 flex items-center justify-center text-xs font-bold">
                  {day}
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <h4 className="font-semibold mb-2 text-sm">Öğrenci Durumu</h4>
            <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
              {students.filter(s => s !== MONTHLY_FREE_DAY).map(student => (
                <div key={student} className="flex justify-between items-center mb-1">
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => setSelectedStudentForPanel(student)}
                  >
                    {student}
                  </span>
                  <span>
                    <span className="font-medium">{getStudentLessonCount(student) || 0}/4</span>
                    <button
                      className="ml-2 px-2 py-1 bg-red-400 text-white rounded text-[10px] hover:bg-red-600"
                      title="Öğrenciyi sil"
                      onClick={() => handleDeleteStudent(student)}
                    >
                      Sil
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-600">
            <p>• Takvimden gün seçin, öğrenci/saat/yer ata</p>
            <p>• Saate tıkla: Dersi tamamla (Boş Zaman için sadece sarı yapar)</p>
            <p>• Saate çift tık: İsim değiştir</p>
            <p>• KAYDET: Programı kaydet</p>
            <p>• Güne 5 kere tıkla: O günün tüm derslerini sıfırla</p>
            <p>• Mavi çerçeve: Sabit ders</p>
            <p>• Yeşil/Sarı/Kırmızı: Tamamlanan/Bekleyen/4. ders (sadece ders kutusu kırmızı)</p>
            <p>• Takvim dış görünümü değişmez</p>
            <p>• Sağdaki öğrenci adlarına tıkla: O öğrencinin geçmiş tamamlanan derslerini ve detaylarını görürsün</p>
            <p>• Tatil: "Tatil" butonunu kullanınca ilgili saat barı sarı görünür.</p>
          </div>
        </div>
        {/* Öğrenci Detay Paneli */}
        {selectedStudentForPanel && (
          <div className="bg-white border-2 border-blue-400 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-blue-900">
                {selectedStudentForPanel} - Ders Geçmişi
              </h4>
              <button
                className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs"
                onClick={() => setSelectedStudentForPanel(null)}
                title="Kapat"
              >
                Kapat
              </button>
            </div>
            {(() => {
              const detaylar = getStudentLessonsDetail(selectedStudentForPanel);
              return (
                <div>
                  <div className="mb-2 text-xs">
                    Toplam tamamlanan ders: <span className="font-bold">{detaylar.length}</span>
                  </div>
                  {detaylar.length === 0 ? (
                    <div className="text-xs text-gray-500">Henüz tamamlanan ders yok.</div>
                  ) : (
                    <ul className="text-xs">
                      {detaylar.map((d, idx) => (
                        <li key={idx}>
                          <span className="font-mono">{d.date}</span> - <span className="font-mono">{d.hour}</span> {d.location ? `- ${d.location}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyLessonScheduler;