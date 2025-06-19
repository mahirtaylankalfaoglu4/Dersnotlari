import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "monthlyLessonScheduler";
const MONTHLY_FREE_DAY = "Boş Zaman";

const MonthlyLessonScheduler = () => {
  // Öğrenci listesini localStorage'da da tutalım ki ekleme/silme kalıcı olsun
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
  const [dayClickCounts, setDayClickCounts] = useState({});
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState('');
  const [hourToAssign, setHourToAssign] = useState(null);

  // Öğrenci Ekleme için
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

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
          for (let hour = 8; hour <= 21; hour++) {
            newSchedule[dateKey][hour] = {
              student: '',
              isCompleted: false,
              isFixed: false,
              lessonCount: 0
            };
          }
          // Salı günü için sabit ders ekle
          const date = new Date(year, month, day);
          if (date.getDay() === 2) {
            newSchedule[dateKey][11] = {
              student: 'Ayşe',
              isCompleted: false,
              isFixed: true,
              lessonCount: 1
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

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

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
  };

  const selectDay = (day) => {
    if (!day) return;
    setSelectedDay(day);
    setSelectedHour(null);

    const dateKey = getDateKey(currentDate, day);
    setDayClickCounts(prev => {
      const newCounts = { ...prev, [dateKey]: (prev[dateKey] || 0) + 1 };
      if (newCounts[dateKey] === 5) {
        setMonthlySchedule(prevSchedule => {
          const newSchedule = { ...prevSchedule };
          Object.keys(newSchedule[dateKey]).forEach(hour => {
            newSchedule[dateKey][hour] = {
              student: '',
              isCompleted: false,
              isFixed: false,
              lessonCount: 0
            };
          });
          return newSchedule;
        });
        setDayClickCounts({ ...prev, [dateKey]: 0 });
      }
      return newCounts;
    });
  };

  const handleStudentAssign = () => {
    if (!studentToAssign || !selectedDay || hourToAssign === null) return;
    const dateKey = getDateKey(currentDate, selectedDay);
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hourToAssign] = {
        ...newSchedule[dateKey][hourToAssign],
        student: studentToAssign,
        isCompleted: false,
        isFixed: false,
        lessonCount: 1
      };
      return newSchedule;
    });
    setShowStudentSelect(false);
    setStudentToAssign('');
    setHourToAssign(null);
  };

  const handleHourClick = (hour) => {
    if (!selectedDay) return;

    const dateKey = getDateKey(currentDate, selectedDay);
    const cell = monthlySchedule[dateKey][hour];

    if (cell.student && !cell.isCompleted) {
      setMonthlySchedule(prev => {
        const newSchedule = { ...prev };
        newSchedule[dateKey][hour].isCompleted = true;
        return newSchedule;
      });

      if (cell.student === MONTHLY_FREE_DAY) {
        setSelectedHour(hour);
        return;
      }

      const completedCount = (studentLessonCounts[cell.student] || 0) + 1;
      if (completedCount >= 4) {
        setStudentLessonCounts(prev => ({
          ...prev,
          [cell.student]: 0
        }));
      } else {
        setStudentLessonCounts(prev => ({
          ...prev,
          [cell.student]: completedCount
        }));
      }
    }
    setSelectedHour(hour);
  };

  const handleDoubleClick = (hour) => {
    if (!selectedDay) return;

    const dateKey = getDateKey(currentDate, selectedDay);
    const cell = monthlySchedule[dateKey][hour];

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
        newSchedule[dateKey][editingCell.hour] = {
          ...newSchedule[dateKey][editingCell.hour],
          student: editValue,
          isCompleted: false
        };
        return newSchedule;
      });
      setEditingCell(null);
      setEditValue('');
    }
  };

  const autoAssignLessons = () => {
    setMonthlySchedule(prevSchedule => {
      const newSchedule = { ...prevSchedule };
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const emptySlots = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${month}-${day}`;
        for (let hour = 8; hour <= 21; hour++) {
          if (!newSchedule[dateKey][hour].student) {
            emptySlots.push({ dateKey, day, hour });
          }
        }
      }

      let slotIndex = 0;
      students.forEach(student => {
        if (student !== MONTHLY_FREE_DAY && (studentLessonCounts[student] || 0) < 1 && slotIndex < emptySlots.length) {
          const slot = emptySlots[slotIndex];
          newSchedule[slot.dateKey][slot.hour] = {
            student,
            isCompleted: false,
            isFixed: false,
            lessonCount: 1
          };
          slotIndex++;
        }
      });

      return newSchedule;
    });
  };

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

  const getDaySchedule = () => {
    if (!selectedDay) return [];
    const dateKey = getDateKey(currentDate, selectedDay);
    const daySchedule = monthlySchedule[dateKey];
    if (!daySchedule) return [];
    return Object.keys(daySchedule).map(hour => ({
      hour: parseInt(hour),
      ...daySchedule[hour]
    })).sort((a, b) => a.hour - b.hour);
  };

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

  // Öğrenci ekle
  const handleAddStudent = () => {
    const name = newStudentName.trim();
    if (!name || students.includes(name) || name === MONTHLY_FREE_DAY) return;
    setStudents(prev => [...prev, name]);
    setStudentLessonCounts(counts => ({ ...counts, [name]: 0 }));
    setNewStudentName('');
    setShowAddStudent(false);
  };

  // Öğrenci sil (takvimden de kaldır)
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
              lessonCount: 0
            };
          }
        });
      });
      return newSchedule;
    });
  };

  // "Boş Zaman" sil veya değiştir
  const handleFreeTimeAction = (dateKey, hour) => {
    if (!window.confirm('Bu "Boş Zaman"ı silmek/değiştirmek istiyor musunuz?')) return;
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hour] = {
        student: '',
        isCompleted: false,
        isFixed: false,
        lessonCount: 0
      };
      return newSchedule;
    });
  };

  // Öğrenci saatini sil
  const handleStudentTimeDelete = (dateKey, hour) => {
    setMonthlySchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[dateKey][hour] = {
        student: '',
        isCompleted: false,
        isFixed: false,
        lessonCount: 0
      };
      return newSchedule;
    });
  };

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
      {/* Sol Panel - Aylık Takvim */}
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

        {/* Yeni Öğrenci Ekle Butonu ve Kutusu */}
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

        <div className="w-full max-w-[410px] min-h-[250px] h-[330px] sm:h-[370px] md:h-[400px] bg-white border-2 border-gray-300 rounded-lg overflow-auto">
          <div className="grid grid-cols-7 h-full">
            {dayNames.map(dayName => (
              <div key={dayName} className="bg-blue-100 border-r border-b border-gray-300 flex items-center justify-center font-bold text-xs sm:text-sm py-2">
                {dayName}
              </div>
            ))}
            {days.map((day, index) => {
              const dateKey = getDateKey(currentDate, day);
              return (
                <div
                  key={index}
                  className={`border-r border-b border-gray-300 p-1 cursor-pointer relative
                    ${day ? 'hover:bg-blue-50' : 'bg-gray-100'}
                    ${selectedDay === day ? 'ring-2 ring-blue-400' : ''}
                    ${day ? 'flex flex-col items-center justify-center' : ''}
                    ${getDayColor(day)}`}
                  onClick={() => selectDay(day)}
                >
                  {day && (
                    <>
                      <span className="font-semibold text-xs sm:text-sm">{day}</span>
                      <div className="text-[10px] sm:text-xs mt-1">
                        {(() => {
                          const daySchedule = monthlySchedule[dateKey];
                          if (daySchedule) {
                            const lessonsCount = Object.values(daySchedule).filter(slot => slot.student).length;
                            const completedCount = Object.values(daySchedule).filter(slot => slot.isCompleted).length;
                            return lessonsCount > 0 ? (
                              <span className={`px-1 rounded ${completedCount === lessonsCount ? 'bg-green-200' : 'bg-yellow-200'}`}>
                                {completedCount}/{lessonsCount}
                              </span>
                            ) : null;
                          }
                          return null;
                        })()}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orta Panel - Günlük Saat Programı */}
      <div className="w-full lg:w-[320px] bg-white border-2 border-gray-300 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-auto min-h-[320px]">
        <h3 className="font-bold text-base mb-3">
          {selectedDay ? `${selectedDay} ${monthNames[currentDate.getMonth()]} - Günlük Program` : 'Bir gün seçin'}
        </h3>

        {selectedDay && (
          <button
            className="mb-2 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 w-full"
            onClick={() => setShowStudentSelect(true)}
          >
            Öğrenci veya Boş Zaman Seç
          </button>
        )}

        {showStudentSelect && (
          <div className="mb-2 p-2 border rounded bg-gray-100">
            <div className="mb-2">
              <label className="block mb-1 text-xs">Saat:</label>
              <select
                className="w-full p-1 rounded border text-xs"
                value={hourToAssign !== null ? hourToAssign : ''}
                onChange={e => setHourToAssign(Number(e.target.value))}
              >
                <option value="">Saat seçin</option>
                {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => (
                  <option key={hour} value={hour}>{hour}:00</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-xs">Öğrenci veya Boş Zaman:</label>
              <select
                className="w-full p-1 rounded border text-xs"
                value={studentToAssign}
                onChange={e => setStudentToAssign(e.target.value)}
              >
                <option value="">Öğrenci veya Boş Zaman seçin</option>
                {students.map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
            <button
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2 text-xs"
              onClick={handleStudentAssign}
            >
              Ata
            </button>
            <button
              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
              onClick={() => setShowStudentSelect(false)}
            >
              İptal
            </button>
          </div>
        )}

        {selectedDay ? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {getDaySchedule().map(({ hour, student, isCompleted, isFixed }) => {
              const isEditing = editingCell?.hour === hour;
              const isHoliday = student === MONTHLY_FREE_DAY;
              const dateKey = getDateKey(currentDate, selectedDay);
              return (
                <div
                  key={hour}
                  className={`p-2 border rounded cursor-pointer text-xs sm:text-sm
                    ${isCompleted && !isHoliday ? 'bg-green-200' : isHoliday ? 'bg-yellow-200' : 'bg-white'}
                    ${isFixed ? 'ring-2 ring-blue-400' : ''}
                    ${selectedHour === hour ? 'border-blue-500' : 'border-gray-300'}
                    hover:bg-gray-50 flex items-center justify-between`}
                  onClick={() => handleHourClick(hour)}
                  onDoubleClick={() => handleDoubleClick(hour)}
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{hour}:00</span>
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
                        {/* Eğer Boş Zaman ise sil butonu */}
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
                        {/* Eğer öğrenci atanmışsa ve sabit değilse sil butonu */}
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
        ) : (
          <div className="text-gray-500 text-center py-8">
            Takvimden bir gün seçin
          </div>
        )}
      </div>

      {/* Sağ Panel - İstatistikler ve Kontroller */}
      <div className="w-full lg:w-[320px] bg-white border-2 border-gray-300 rounded-lg p-3 flex-shrink-0 flex flex-col overflow-auto min-h-[320px]">
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
                <span>{student}</span>
                <span>
                  <span className="font-medium">{studentLessonCounts[student] || 0}/4</span>
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
          <p>• Takvimden gün seçin</p>
          <p>• Saate tek tık: Dersi tamamla (Boş Zaman için sadece sarı yapar)</p>
          <p>• Saate çift tık: İsim değiştir</p>
          <p>• KAYDET: Programı kaydet</p>
          <p>• Güne 5 kere tıkla: O günün tüm derslerini sıfırla</p>
          <p>• Öğrenci veya Boş Zaman Seç: O gün ve saatte öğrenci veya tatil ata</p>
          <p>• Mavi çerçeve: Sabit ders</p>
          <p>• Yeşil/Sarı: Tamamlanan/Bekleyen/Boş Zaman</p>
          <p>• Öğrenciler listesi: Sil ile silebilirsin, Ekle ile yeni öğrenci ekleyebilirsin.</p>
          <p>• Takvimde “Boş Zaman” veya öğrenci saatinin yanında Sil ile anında kaldırabilirsin ve başka bir şey atayabilirsin.</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyLessonScheduler;