import React from 'react';
import styles from './DatePicker.module.css';

const MONTHS = [
    'يناير','فبراير','مارس','أبريل','مايو','يونيو',
    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'
];

// Generate years from 1980 to current year
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

const DatePicker = ({ value, onChange, disabled }) => {
    const [year, month, day] = value ? value.split('-') : ['', '', ''];

    const daysInMonth = (y, m) => {
        if (!y || !m) return 31;
        return new Date(parseInt(y), parseInt(m), 0).getDate();
    };

    const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);

    const update = (newYear, newMonth, newDay) => {
        if (newYear && newMonth && newDay) {
            // Clamp day if month changed
            const maxDay = new Date(parseInt(newYear), parseInt(newMonth), 0).getDate();
            const clampedDay = Math.min(parseInt(newDay), maxDay);
            onChange(`${newYear}-${String(newMonth).padStart(2,'0')}-${String(clampedDay).padStart(2,'0')}`);
        } else {
            onChange('');
        }
    };

    return (
        <div className={styles.datePicker}>
            {/* Day */}
            <select
                className={styles.select}
                value={day || ''}
                onChange={e => update(year, month, e.target.value)}
                disabled={disabled}
            >
                <option value="">يوم</option>
                {days.map(d => (
                    <option key={d} value={String(d).padStart(2,'0')}>{d}</option>
                ))}
            </select>

            {/* Month */}
            <select
                className={styles.select}
                value={month || ''}
                onChange={e => update(year, e.target.value, day)}
                disabled={disabled}
            >
                <option value="">شهر</option>
                {MONTHS.map((m, i) => (
                    <option key={i+1} value={String(i+1).padStart(2,'0')}>{m}</option>
                ))}
            </select>

            {/* Year */}
            <select
                className={styles.select}
                value={year || ''}
                onChange={e => update(e.target.value, month, day)}
                disabled={disabled}
            >
                <option value="">سنة</option>
                {YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
};

export default DatePicker;
