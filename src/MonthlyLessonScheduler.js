import React, { useState, useEffect } from 'react';

const STORAGE_KEY = "monthlyLessonScheduler";

const MonthlyLessonScheduler = () => {
  const [students] = useState([
    'E Öykü', 'Güneş M', 'Asya A', 'Mila B', 'Duru B', 'Eda', 'Erva', 'Rengin',
    'Miray', 'Toprak A', 'Erva K', 'İpek', 'Güneş O', 'Ecrin S', 'Ulaş Y', 'Ayşe Hanım'
  ]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);

  const [monthlySchedule, setMonthlySchedule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.monthlySchedule;
      } catch {}
    }
    const schedule = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      schedule[dateKey] = {};
      for (let hour = 8; hour <= 19; hour++) {
        schedule[dateKey][hour] = {
          student: '',
          isCompleted: false,
          isFixed: false,
          lessonCount: 0
        };
      }
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() === 2) {
        const dateKey = `${year}-${month}-${day}`;
        schedule[dateKey][11] = {
          student: 'Ayşe',
          isCompleted: false,
          isFixed: true,
          lessonCount: 1
        };
      }
    }
    return schedule;
  });

  const [studentLessonCounts, setStudentLessonCounts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.studentLessonCounts;
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
  const [freeTimeActivities, setFreeTimeActivities] = useState([]);
  const [dayClickCounts, setDayClickCounts] = useState({});
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState('');
  const [hourToAssign, setHourToAssign] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMonthlySchedule(parsed.monthlySchedule);
        setStudentLessonCounts(parsed.studentLessonCounts);
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

    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const newSchedule = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      newSchedule[dateKey] = {};
      for (let hour = 8; hour <= 19; hour++) {
        newSchedule[dateKey][hour] = {
          student: '',
          isCompleted: false,
          isFixed: false,
          lessonCount: 0
        };
      }
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
    setMonthlySchedule(newSchedule);
  };

  // Güne tıklama ve 5 kere tıklama kontrolü
  const selectDay = (day) => {
    if (!day) return;
    setSelectedDay(day);
    setSelectedHour(null);

    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    setDayClickCounts(prev => {
      const newCounts = { ...prev, [dateKey]: (prev[dateKey] || 0) + 1 };
      // 5. tıklamada o günün tüm derslerini sıfırla
      if (newCounts[dateKey] === 5) {
        const newSchedule = { ...monthlySchedule };
        Object.keys(newSchedule[dateKey]).forEach(hour => {
          newSchedule[dateKey][hour] = {
            student: '',
            isCompleted: false,
            isFixed: false,
            lessonCount: 0
          };
        });
        setMonthlySchedule(newSchedule);
        setDayClickCounts({ ...prev, [dateKey]: 0 });
      }
      return newCounts;
    });
  };

  // Sağ panelde öğrenci seçme işlemi
  const handleStudentAssign = () => {
    if (!studentToAssign || !selectedDay || hourToAssign === null) return;
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
    const newSchedule = { ...monthlySchedule };
    newSchedule[dateKey][hourToAssign] = {
      ...newSchedule[dateKey][hourToAssign],
      student: studentToAssign,
      isCompleted: false,
      isFixed: false,
      lessonCount: 1
    };
    setMonthlySchedule(newSchedule);
    setShowStudentSelect(false);
    setStudentToAssign('');
    setHourToAssign(null);
  };

  const handleHourClick = (hour) => {
    if (!selectedDay) return;

    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
    const cell = monthlySchedule[dateKey][hour];

    if (cell.student && !cell.isCompleted) {
      const newSchedule = { ...monthlySchedule };
      newSchedule[dateKey][hour].isCompleted = true;
      setMonthlySchedule(newSchedule);

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

    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
    const cell = monthlySchedule[dateKey][hour];

    if (!cell.isFixed) {
      setEditingCell({ day: selectedDay, hour });
      setEditValue(cell.student);
    }
  };

  const saveEdit = () => {
    if (editingCell && selectedDay) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
      const newSchedule = { ...monthlySchedule };
      newSchedule[dateKey][editingCell.hour] = {
        ...newSchedule[dateKey][editingCell.hour],
        student: editValue,
        isCompleted: false
      };
      setMonthlySchedule(newSchedule);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const autoAssignLessons = () => {
    const newSchedule = { ...monthlySchedule };
    const newCounts = { ...studentLessonCounts };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const emptySlots = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      for (let hour = 8; hour <= 19; hour++) {
        if (!newSchedule[dateKey][hour].student) {
          emptySlots.push({ dateKey, day, hour });
        }
      }
    }

    let slotIndex = 0;
    students.forEach(student => {
      if (newCounts[student] < 1 && slotIndex < emptySlots.length) {
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

    setMonthlySchedule(newSchedule);
  };

  const addFreeTimeActivity = () => {
    const newActivity = {
      id: Date.now(),
      name: 'Boş Zaman',
      isActive: false
    };
    setFreeTimeActivities([...freeTimeActivities, newActivity]);
  };

  const getDaySchedule = () => {
    if (!selectedDay) return [];

    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
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

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      const daySchedule = monthlySchedule[dateKey];

      if (daySchedule) {
        Object.values(daySchedule).forEach(slot => {
          if (slot.student) {
            totalLessons++;
            if (slot.isCompleted) completedLessons++;
          } else {
            freeSlots++;
          }
        });
      }
    }

    return { totalLessons, completedLessons, freeSlots };
  };

  const handleSave = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        monthlySchedule,
        studentLessonCounts,
      })
    );
    alert("Program kaydedildi!");
  };

  const days = getDaysInMonth();
  const stats = getMonthStats();

  return (
    <div className="flex gap-4 p-4 bg-gray-50 min-h-screen">
      {/* Sol Panel - Aylık Takvim */}
      <div className="flex flex-col">
        {/* Ay Navigasyonu */}
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border-2 border-gray-300">
          <button
            onClick={() => changeMonth(-1)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ← Önceki
          </button>
          <h2 className="text-xl font-bold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => changeMonth(1)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sonraki →
          </button>
        </div>

        {/* Takvim Tablosu */}
        <div className="w-[500px] h-[400px] bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 h-full">
            {/* Gün başlıkları */}
            {dayNames.map(dayName => (
              <div key={dayName} className="bg-blue-100 border-r border-b border-gray-300 flex items-center justify-center font-bold text-sm p-2">
                {dayName}
              </div>
            ))}

            {/* Günler */}
            {days.map((day, index) => {
              const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
              return (
                <div
                  key={index}
                  className={`border-r border-b border-gray-300 p-1 cursor-pointer relative
                    ${day ? 'hover:bg-blue-50' : 'bg-gray-100'}
                    ${selectedDay === day ? 'bg-blue-200' : ''}
                    ${day ? 'flex flex-col items-center justify-center' : ''}`}
                  onClick={() => selectDay(day)}
                >
                  {day && (
                    <>
                      <span className="font-semibold text-sm">{day}</span>
                      <div className="text-xs mt-1">
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

        {/* Boş Zaman Aktiviteleri */}
        <div className="mt-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={addFreeTimeActivity}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Boş Zaman Ekle
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {freeTimeActivities.map(activity => (
              <div
                key={activity.id}
                className={`w-[140px] h-[100px] border-2 rounded-lg flex items-center justify-center cursor-pointer text-sm font-medium
                  ${activity.isActive ? 'bg-pink-200 border-pink-400' : 'bg-yellow-200 border-yellow-400'}
                  hover:opacity-80`}
                onClick={() => setFreeTimeActivities(prev =>
                  prev.map(a => a.id === activity.id ? { ...a, isActive: !a.isActive } : a)
                )}
              >
                {activity.isActive ? 'Program Aktif' : 'Boş Zaman'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Orta Panel - Günlük Saat Programı */}
      <div className="w-[300px] bg-white border-2 border-gray-300 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4">
          {selectedDay ? `${selectedDay} ${monthNames[currentDate.getMonth()]} - Günlük Program` : 'Bir gün seçin'}
        </h3>

        {selectedDay && (
          <button
            className="mb-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
            onClick={() => setShowStudentSelect(true)}
          >
            Öğrenci Seç
          </button>
        )}

        {showStudentSelect && (
          <div className="mb-2 p-2 border rounded bg-gray-100">
            <div className="mb-2">
              <label className="block mb-1 text-sm">Saat:</label>
              <select
                className="w-full p-1 rounded border"
                value={hourToAssign !== null ? hourToAssign : ''}
                onChange={e => setHourToAssign(Number(e.target.value))}
              >
                <option value="">Saat seçin</option>
                {Array.from({ length: 12 }, (_, i) => 8 + i).map(hour => (
                  <option key={hour} value={hour}>{hour}:00</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block mb-1 text-sm">Öğrenci:</label>
              <select
                className="w-full p-1 rounded border"
                value={studentToAssign}
                onChange={e => setStudentToAssign(e.target.value)}
              >
                <option value="">Öğrenci seçin</option>
                {students.map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
            <button
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
              onClick={handleStudentAssign}
            >
              Ata
            </button>
            <button
              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
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

              return (
                <div
                  key={hour}
                  className={`p-2 border rounded cursor-pointer
                    ${isCompleted ? 'bg-green-200' : 'bg-white'}
                    ${isFixed ? 'ring-2 ring-blue-400' : ''}
                    ${selectedHour === hour ? 'border-blue-500' : 'border-gray-300'}
                    hover:bg-gray-50`}
                  onClick={() => handleHourClick(hour)}
                  onDoubleClick={() => handleDoubleClick(hour)}
                >
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
                      className="w-full mt-1 text-sm bg-transparent border-none outline-none"
                      autoFocus
                    />
                  ) : (
                    <div className="text-sm mt-1">{student || 'Boş'}</div>
                  )}
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
      <div className="w-[300px] bg-white border-2 border-gray-300 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4">Aylık Özet</h3>

        {/* Otomatik Atama */}
        <button
          onClick={autoAssignLessons}
          className="w-full mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Otomatik Ders Ata
        </button>
        {/* KAYDET Butonu */}
        <button
          onClick={handleSave}
          className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          KAYDET
        </button>

        {/* Aylık İstatistikler */}
        <div className="mb-4 bg-gray-50 p-3 rounded">
          <h4 className="font-semibold mb-2">Ay İstatistikleri</h4>
          <div className="space-y-1 text-sm">
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
              <span>Tamamlanma:</span>
              <span className="font-medium">
                {stats.totalLessons > 0 ? Math.round((stats.completedLessons/stats.totalLessons)*100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Öğrenci Ders Sayıları */}
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Öğrenci Durumu</h4>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded text-xs">
            {students.map(student => (
              <div key={student} className="flex justify-between mb-1">
                <span>{student}</span>
                <span className="font-medium">{studentLessonCounts[student] || 0}/4</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kullanım Bilgisi */}
        <div className="text-xs text-gray-600">
          <p className="mb-1">• Takvimden gün seçin</p>
          <p className="mb-1">• Saate tek tık: Dersi tamamla</p>
          <p className="mb-1">• Saate çift tık: İsim değiştir</p>
          <p className="mb-1">• KAYDET: Programı kaydet</p>
          <p className="mb-1">• Güne 5 kere tıkla: O günün tüm derslerini sıfırla</p>
          <p className="mb-1">• Öğrenci Seç: O gün ve saatte öğrenci ata</p>
          <p className="mb-1">• Mavi çerçeve: Sabit ders</p>
          <p>• Yeşil/Sarı: Tamamlanan/Bekleyen</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyLessonScheduler;