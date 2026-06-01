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
        allowances: data.allowances,
        country: data.company.country,
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
    const content = [
      `<h1>TopShift - ${t('hours.title')} ${month}</h1>`,
      `<p>${t('hours.disclaimer')}</p>`,
      '<table border="1" cellspacing="0" cellpadding="6">',
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
