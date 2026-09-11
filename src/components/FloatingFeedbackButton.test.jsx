import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FloatingFeedbackButton from './FloatingFeedbackButton';

const mockUseAuth = vi.fn();
const mockEnsureGuestSessionId = vi.fn(() => 'guest-session');
const mockReadPrescriptionSaved = vi.fn(() => null);

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/storage', () => ({
  ensureGuestSessionId: () => mockEnsureGuestSessionId(),
}));

vi.mock('../lib/prescriptionStorage', () => ({
  readPrescriptionSaved: () => mockReadPrescriptionSaved(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('FloatingFeedbackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isGuest: false,
    });
  });

  function renderAt(pathname, state) {
    return render(
      <MemoryRouter initialEntries={[{ pathname, state }]}>
        <FloatingFeedbackButton />
      </MemoryRouter>
    );
  }

  it('hides itself on auth routes', () => {
    renderAt('/auth');
    expect(screen.queryByLabelText('피드백 보내기')).not.toBeInTheDocument();
  });

  it('renders the floating button on regular routes', () => {
    renderAt('/home');
    expect(screen.getByLabelText('피드백 보내기')).toBeInTheDocument();
  });

  it('opens feedback modal when button is clicked', () => {
    renderAt('/home');
    fireEvent.click(screen.getByLabelText('피드백 보내기'));
    expect(screen.getByPlaceholderText('불편했던 점이나 개선되었으면 하는 점을 적어주세요.')).toBeInTheDocument();
    const submitButtons = screen.getAllByRole('button', { name: '피드백 보내기' });
    expect(submitButtons[submitButtons.length - 1]).toBeDisabled();
  });

  it('uses saved prescription context on prescription routes', () => {
    mockReadPrescriptionSaved.mockReturnValue({
      reportId: 'report-1',
      fromType: 'ICMT',
      isPaid: true,
    });

    renderAt('/prescription/result/report-1');
    fireEvent.click(screen.getByLabelText('피드백 보내기'));

    expect(screen.getByText('현재 페이지 문맥이 함께 저장됩니다.')).toBeInTheDocument();
    expect(mockReadPrescriptionSaved).toHaveBeenCalled();
  });
});
