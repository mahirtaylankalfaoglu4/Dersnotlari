import React, { useState, useEffect } from "react";
import axios from "axios";

// === KULLANICI GİRİŞİ VE UZAKTAN KAYIT DESTEĞİ ===

const CLOUD_URL = "https://api.jsonbin.io/v3/b/YOUR_BIN_ID"; // örn: "https://api.jsonbin.io/v3/b/665b1e9fecf8c34f8722f34e"
const CLOUD_SECRET = "YOUR_BIN_SECRET"; // örn: "$2b$10$XXXXXX..."

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
const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const hourToKey = (hourStr) => hourStr.replace(":", "_");
const keyToHour = (key) => key.replace("_", ":");

// --- LOGIN PANEL ---
function LoginPanel({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();
    if (user === "sukran" && pass === "1234") {
      onLogin();
    } else {
      setError("Kullanıcı adı veya şifre hatalı!");
    }
  }

  return (
    <div style={{ width: 320, margin: "80px auto", padding: 32, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Giriş Yap</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={pass}
          onChange={e => setPass(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
        />
        <button type="submit" style={{ width: "100%", padding: 10, borderRadius: 6, background: "#29916f", color: "#fff", fontWeight: 700, border: "none" }}>
          Giriş
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  );
}

const MonthlyLessonScheduler = () => {
  // --- LOGIN STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- UZAKTAN YÜKLENEN STATE'LER ---
  const [students, setStudents] = useState([
    "E Öykü", "Güneş M", "Asya A", "Mila B", "Duru B", "Eda", "Erva", "Rengin",
    "Miray", "Toprak A", "Erva K", "İpek", "Güneş O", "Ecrin S", "Ulaş Y", "Ayşe Hanım", MONTHLY_FREE_DAY
  ]);
  const [monthlySchedule, setMonthlySchedule] = useState({});
  const [studentLessonCounts, setStudentLessonCounts] = useState({});
  // --- LOCAL STATE'LER ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [studentToAssign, setStudentToAssign] = useState('');
  const [hourToAssign, setHourToAssign] = useState('');
  const [locationToAssign, setLocationToAssign] = useState(LOCATIONS[0]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedStudentForPanel, setSelectedStudentForPanel] = useState(null);
  const [vacationHour, setVacationHour] = useState(null);

  // --- UZAKTAN YÜKLEME ---
  useEffect(() => {
    if (!isLoggedIn) return;
    async function fetchCloudData() {
      try {
        const res = await axios.get(CLOUD_URL, {
          headers: { "X-Access-Key": CLOUD_SECRET }
        });
        const data = res.data.record || {};
        setStudents(data.students || [
          "E Öykü", "Güneş M", "Asya A", "Mila B", "Duru B", "Eda", "Erva", "Rengin",
          "Miray", "Toprak A", "Erva K", "İpek", "Güneş O", "Ecrin S", "Ulaş Y", "Ayşe Hanım", MONTHLY_FREE_DAY
        ]);
        setMonthlySchedule(data.monthlySchedule || {});
        setStudentLessonCounts(data.studentLessonCounts || {});
      } catch (err) {
        setStudents([
          "E Öykü", "Güneş M", "Asya A", "Mila B", "Duru B", "Eda", "Erva", "Rengin",
          "Miray", "Toprak A", "Erva K", "İpek", "Güneş O", "Ecrin S", "Ulaş Y", "Ayşe Hanım", MONTHLY_FREE_DAY
        ]);
        setMonthlySchedule({});
        setStudentLessonCounts({});
      }
    }
    fetchCloudData();
  }, [isLoggedIn]);

  // Ay takvimi için eksik günleri schedule'a ekle (her geçişte veya ilk açılışta)
  useEffect(() => {
    if (!isLoggedIn) return;
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
  }, [currentDate, isLoggedIn]);

  // Ay/gün anahtarını üret
  const getDateKey = (dateObj, day) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay();
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

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
    setShowAssignPanel(true);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
    setSelectedHour(null);
    setVacationHour(null);
  };

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

  // --- TÜM HAFTALARA UYGULA ---
  const handleAssignAllWeeks = () => {
    if (!studentToAssign || !hourToAssign || !selectedDay || !locationToAssign) return;

    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    const targetDayOfWeek = startDate.getDay();

    let monthsToCheck = [
      { year: currentDate.getFullYear(), month: currentDate.getMonth() },
      { year: currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear(), month: (currentDate.getMonth() + 1) % 12 }
    ];

    let assignments = {};

    monthsToCheck.forEach(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        if (
          (year > currentDate.getFullYear() || month > currentDate.getMonth() || day >= selectedDay)
          &&
          dateObj.getDay() === targetDayOfWeek
        ) {
          const dateKey = `${year}-${month}-${day}`;
          if (!assignments[dateKey]) assignments[dateKey] = {};
          assignments[dateKey][hourToKey(hourToAssign)] = {
            student: studentToAssign,
            isCompleted: false,
            isFixed: false,
            lessonCount: 1,
            location: locationToAssign
          };
        }
      }
    });

    setMonthlySchedule(prev => {
      let newSchedule = { ...prev };
      Object.keys(assignments).forEach(dateKey => {
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
        }
        newSchedule[dateKey][hourToKey(hourToAssign)] = assignments[dateKey][hourToKey(hourToAssign)];
      });
      return newSchedule;
    });

    setShowAssignPanel(false);
    setStudentToAssign('');
    setHourToAssign('');
    setLocationToAssign(LOCATIONS[0]);
    setVacationHour(null);
  };

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

  const isFourthLesson = (studentName, isCompleted) => {
    if (!studentName || studentName === MONTHLY_FREE_DAY) return false;
    const count = getStudentLessonCount(studentName);
    return count === 3 && !isCompleted;
  };

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

  const getStudentLessonsDetail = (studentName) => {
    const lessons = [];
    Object.entries(monthlySchedule).forEach(([dateKey, hoursObj]) => {
      Object.entries(hoursObj).forEach(([hour, slot]) => {
        if (
          slot.student === studentName &&
          slot.isCompleted
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

  const handleSave = async () => {
    try {
      await axios.put(CLOUD_URL, {
        students,
        monthlySchedule,
        studentLessonCounts,
      }, {
        headers: { "X-Access-Key": CLOUD_SECRET, "Content-Type": "application/json" }
      });
      alert("Kayıt merkezi olarak buluta kaydedildi!");
    } catch (e) {
      alert("Hata! Veri kaydedilemedi.");
    }
  };

  const days = getDaysInMonth();
  const stats = getMonthStats();
  const freeDays = getFreeDays();
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

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

  if (!isLoggedIn) return <LoginPanel onLogin={() => setIsLoggedIn(true)} />;

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
            <div className="flex gap-2 flex-wrap">
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
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-800 text-xs"
                onClick={handleAssignAllWeeks}
                disabled={!studentToAssign || !hourToAssign || !locationToAssign}
                title="Bu öğrenci, saat ve yeri bugünden itibaren 2 ay boyunca haftalık aynı güne uygular."
              >
                Tüm Haftalara Uygula
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
            <p>• Tüm Haftalara Uygula: Seçili öğrenci-saat-yer ile 2 ay boyunca o haftanın aynı günü ve saatine uygular</p>
            <p>• Mavi çerçeve: Sabit ders</p>
            <p>• Yeşil/Sarı/Kırmızı: Tamamlanan/Bekleyen/4. ders (sadece ders kutusu kırmızı)</p>
            <p>• Takvim dış görünümü değişmez</p>
            <p>• Sağdaki öğrenci adlarına tıkla: O öğrencinin geçmiş tamamlanan derslerini ve detaylarını görürsün</p>
            <p>• Tatil: "Tatil" butonunu kullanınca ilgili saat barı sarı görünür.</p>
          </div>
        </div>
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