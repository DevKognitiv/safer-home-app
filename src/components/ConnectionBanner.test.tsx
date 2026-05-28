import { fireEvent, render } from '@testing-library/react-native';
import { ConnectionBanner } from '@/components/ConnectionBanner';

describe('ConnectionBanner', () => {
  it('shows a reconnect affordance and fires onReconnect when errored', () => {
    const onReconnect = jest.fn();
    const { getByText } = render(
      <ConnectionBanner connection="error" onReconnect={onReconnect} />,
    );

    expect(getByText('Connection error')).toBeTruthy();
    fireEvent.press(getByText('Tap to reconnect'));
    expect(onReconnect).toHaveBeenCalledTimes(1);
  });

  it('hides the reconnect affordance when connected', () => {
    const { queryByText, getByText } = render(
      <ConnectionBanner connection="connected" onReconnect={jest.fn()} />,
    );

    expect(getByText('Connected')).toBeTruthy();
    expect(queryByText('Tap to reconnect')).toBeNull();
  });
});
