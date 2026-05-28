import { selectAlertsToNotify } from '@/services/notifications';
import { Alert } from '@/types';

function alert(id: string, partial: Partial<Alert> = {}): Alert {
  return {
    id,
    title: id,
    message: 'msg',
    severity: 'critical',
    state: 'active',
    raisedAt: '2026-05-28T00:00:00Z',
    ...partial,
  };
}

describe('selectAlertsToNotify', () => {
  it('notifies newly active non-info alerts', () => {
    const { toNotify, notifiedIds } = selectAlertsToNotify(new Set(), [
      alert('alert.a'),
      alert('alert.info', { severity: 'info' }),
      alert('alert.resolved', { state: 'resolved' }),
    ]);
    expect(toNotify.map((a) => a.id)).toEqual(['alert.a']);
    expect(notifiedIds.has('alert.a')).toBe(true);
    expect(notifiedIds.has('alert.info')).toBe(false);
  });

  it('does not re-notify alerts already notified', () => {
    const { toNotify, notifiedIds } = selectAlertsToNotify(
      new Set(['alert.a']),
      [alert('alert.a')],
    );
    expect(toNotify).toHaveLength(0);
    expect(notifiedIds.has('alert.a')).toBe(true);
  });

  it('prunes ids once their alert is no longer active', () => {
    const { notifiedIds } = selectAlertsToNotify(new Set(['alert.a']), [
      alert('alert.a', { state: 'resolved' }),
    ]);
    expect(notifiedIds.has('alert.a')).toBe(false);
  });
});
