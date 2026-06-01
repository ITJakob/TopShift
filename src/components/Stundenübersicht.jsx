import { useMemo, useState } from 'react';
import { calculateMonthlyHours, createHoursCsv, downloadTextFile } from '../lib/stundenBerechnung.js';

export default function Stundenübersicht({ data, actions, t, employeeId }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const rows = useMemo(
    () =>
      calculateMonthlyHours({
        employees: employeeId ? data.employees.filter((employee) => employee.id === employeeId) : data.employees,
        shifts: data.shifts,
        sickReports: data.sickReports,
        absenceRequests: data.absenceRequests || [],
        timeEntries: data.timeEntries || [],
        allowances: data.allowances,
        country: data.company.country,
        region: data.company.region,
        month,
      }),
    [data, employeeId, month],
  );

  const labels = {
    employee: t('common.employee'),
    planned: t('hours.planned'),
    actual: t('hours.actual'),
    overtime: t('hours.overtime'),
    night: t('hours.night'),
    sunday: t('hours.sunday'),
    holiday: t('hours.holiday'),
    sickDays: t('hours.sickDays'),
    vacationDays: t('hours.vacationDays'),
    allowances: t('hours.allowances'),
  };

  function exportCsv() {
    downloadTextFile(`topshift-hours-${month}.csv`, createHoursCsv(rows, labels), 'text/csv');
  }

  function exportPdf() {
    const totals = rows.reduce(
      (sum, row) => ({
        planned: sum.planned + row.planned,
        actual: sum.actual + row.actual,
        overtime: sum.overtime + row.overtime,
        night: sum.night + row.night,
        sunday: sum.sunday + row.sunday,
        holiday: sum.holiday + row.holiday,
      }),
      { planned: 0, actual: 0, overtime: 0, night: 0, sunday: 0, holiday: 0 },
    );
    const content = [
      '<style>body{font-family:Inter,Arial,sans-serif;color:#111827} table{width:100%;border-collapse:collapse} th,td{border:1px solid #d1d5db;padding:8px;text-align:left} th{background:#eff6ff} .muted{color:#4b5563}.totals{margin:16px 0;display:flex;gap:12px}.box{border:1px solid #d1d5db;padding:10px;border-radius:8px}</style>',
      `<h1>TopShift - ${t('hours.title')} ${month}</h1>`,
      `<p><strong>${data.company.name}</strong> · ${t(`country.${data.company.country}`)} · ${t(`industry.${data.company.industry}`)}</p>`,
      `<p class="muted">${t('hours.disclaimer')}</p>`,
      `<div class="totals"><div class="box">${t('hours.planned')}: ${totals.planned.toFixed(2)}h</div><div class="box">${t('hours.actual')}: ${totals.actual.toFixed(2)}h</div><div class="box">${t('hours.overtime')}: ${totals.overtime.toFixed(2)}h</div></div>`,
      '<table>',
      `<thead><tr>${Object.values(labels)
        .map((label) => `<th>${label}</th>`)
        .join('')}</tr></thead>`,
      `<tbody>${rows
        .map(
          (row) =>
            `<tr><td>${row.employeeName}</td><td>${row.planned}</td><td>${row.actual}</td><td>${row.overtime}</td><td>${row.night}</td><td>${row.sunday}</td><td>${row.holiday}</td><td>${row.sickDays}</td><td>${row.vacationDays}</td><td>${row.allowances}</td></tr>`,
        )
        .join('')}</tbody>`,
      '</table>',
    ].join('');
    const win = window.open('', '_blank');
    win.document.write(content);
    win.document.close();
    win.print();
  }

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('hours.correctBeforeExport')}</p>
          <h2>{employeeId ? t('employee.myHours') : t('hours.title')}</h2>
        </div>
        <div className="button-row">
          <input value={month} onChange={(event) => setMonth(event.target.value)} type="month" />
          <button className="secondary-button" onClick={exportCsv}>
            {t('common.exportCsv')}
          </button>
          <button className="secondary-button" onClick={exportPdf}>
            {t('common.exportPdf')}
          </button>
        </div>
      </div>

      <div className="info-banner">{t('hours.disclaimer')}</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{labels.employee}</th>
              <th>{labels.planned}</th>
              <th>{labels.actual}</th>
              <th>{labels.overtime}</th>
              <th>{labels.night}</th>
              <th>{labels.sunday}</th>
              <th>{labels.holiday}</th>
              <th>{labels.sickDays}</th>
              <th>{labels.vacationDays}</th>
              <th>{labels.allowances}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td>{row.employeeName}</td>
                <td>{row.planned}</td>
                <td>{row.actual}</td>
                <td className={row.overtime > 0 ? 'warning-text' : ''}>{row.overtime}</td>
                <td>{row.night}</td>
                <td>{row.sunday}</td>
                <td>{row.holiday}</td>
                <td>{row.sickDays}</td>
                <td>{row.vacationDays}</td>
                <td>
                  {employeeId ? (
                    row.allowances || '-'
                  ) : (
                    <input
                      value={row.allowances}
                      onChange={(event) => actions.setAllowance(row.employeeId, event.target.value)}
                      placeholder={t('hours.allowancePlaceholder')}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
