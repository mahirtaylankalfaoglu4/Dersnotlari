const MonthlyLessonScheduler = () => {
  //...

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const [monthlySchedule, setMonthlySchedule] = useState(() => {
    //...
  });

  const handleHourClick = (hour) => {
    if (!selectedDay) return;

    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
    const cell = monthlySchedule[dateKey][hour];

    if (cell.student &&!cell.isCompleted) {
      const newSchedule = {...monthlySchedule };
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
      const newSchedule = {...monthlySchedule };
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

  const handleStudentAssign = () => {
    if (!studentToAssign ||!selectedDay || hourToAssign === null) return;
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${selectedDay}`;
    const newSchedule = {...monthlySchedule };
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
                    ${day? 'hover:bg-blue-50' : 'bg-gray-100'}
                    ${selectedDay === day? 'bg-yellow-200' : ''}
                    ${monthlySchedule[dateKey] && monthlySchedule[dateKey][11] && monthlySchedule[dateKey][11].student === 'Ayşe'? 'bg-yellow-200' : ''}
                  `}
                  onClick={() => selectDay(day)}
                >
                  {day && (
                    <span className="font-semibold text-sm">{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Boş Zaman Aktiviteleri */}
        <div className="mt-4">
          {/* KAYDET Butonu */}
          <button
            onClick={handleSave}
            className="w-full mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            KAYDET
          </button>
        </div>
      </div>

      {/* Orta Panel - Günlük Saat Programı */}
      <div className="w-[300px] bg-white border-2 border-gray-300 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4">
          {selectedDay? `${selectedDay} ${monthNames[currentDate.getMonth()]} - Günlük Program` : 'Bir gün seçin'}
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
                value={hourToAssign!== null? hourToAssign : ''}
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

        {selectedDay? (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {getDaySchedule().map(({ hour, student, isCompleted, isFixed }) => {
              const isEditing = editingCell?.hour === hour;

              return (
                <div
                  key={hour}
                  className={`p-2 border rounded cursor-pointer
                    ${isCompleted? 'bg-green-200' : 'bg-white'}
                    ${isFixed? 'ring-2 ring-blue-400' : ''}
                    ${selectedHour === hour? 'border-blue-500' : 'border-gray-300'}
                    hover:bg-gray-50`}
                  onClick={() => handleHourClick(hour)}
                  onDoubleClick={() => handleDoubleClick(hour)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{hour}:00</span>
                    {isFixed && <span className="text-blue-500 text-xs">Sabit</span>}
                  </div>
                  {isEditing? (
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
          onClick={() => autoAssignLessons()}
          className="w-full mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Otomatik Ders Ata
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
              <span>Tatil Günleri:</span>
              {Object.keys(monthlySchedule).filter(dateKey => {
                const daySchedule = monthlySchedule[dateKey];
                if (daySchedule && daySchedule[11] && daySchedule[11].student === 'Ayşe') {
                  return true;
                }
                return false;
              }).length > 0? (
                <span className="font-medium text-yellow-600">
                  {Object.keys(monthlySchedule).filter(dateKey => {
                    const daySchedule = monthlySchedule[dateKey];
                    if (daySchedule && daySchedule[11] && daySchedule[11].student === 'Ayşe') {
                      return true;
                    }
                    return false;
                  }).length}
                </span>
              ) : (
                <span className="font-medium">0</span>
              )}
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
        </div>
      </div>
    </div>
  );
};

export default MonthlyLessonScheduler;