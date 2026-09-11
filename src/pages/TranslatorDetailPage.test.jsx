import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConsultingDetailPage from './ConsultingDetailPage';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseNickname = vi.fn();
const mockUseReportStatus = vi.fn();
const mockFetch = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../context/NicknameContext', () => ({
  useNickname: () => mockUseNickname(),
}));

vi.mock('../hooks/useReportStatus', () => ({
  useReportStatus: () => mockUseReportStatus(),
}));

vi.mock('../components/SiteHeader', () => ({
  default: ({ onLogoClick }) => (
    <button type="button" onClick={onLogoClick}>
      header
    </button>
  ),
}));

vi.mock('../components/ConsultingBeforeAfterCard', () => ({
  default: () => <div>before-after-card</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    storage: {
      from: () => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      }),
    },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ConsultingDetailPage />
    </MemoryRouter>
  );
}

describe('ConsultingDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;

    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
    });

    mockUseNickname.mockReturnValue({
      nickname: '비주든',
    });

    mockUseReportStatus.mockReturnValue({
      prescription: {
        done: false,
      },
    });

    mockOrder.mockResolvedValue({ data: [] });
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, eq: mockEq, order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, maybeSingle: mockMaybeSingle });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows empty reviews placeholder when no approved reviews exist', async () => {
    renderPage();

    expect(await screen.findByText('Reviews')).toBeInTheDocument();
    expect(await screen.findByText('아직 공개된 후기가 없습니다.')).toBeInTheDocument();
  });

  it('renders approved reviews when they exist', async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: 'review-1',
          text: '정말 도움됐어요',
          reviewer_name: '진욱',
          before_image_url: null,
          after_image_url: null,
          created_at: '2026-05-05T12:00:00.000Z',
        },
      ],
    });

    renderPage();

    expect(await screen.findByText('정말 도움됐어요')).toBeInTheDocument();
    expect(screen.getByText(/진욱/)).toBeInTheDocument();
  });

  it('shows locked review placeholder when user has no unlocked intake', async () => {
    renderPage();

    expect(
      await screen.findByText('후기 작성은 컨설팅 완료 후 가능합니다.')
    ).toBeInTheDocument();
  });

  it('shows review CTA when logged-in user has completed and unlocked intake', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      session: { access_token: 'token' },
    });
    mockUseReportStatus.mockReturnValue({
      prescription: {
        done: true,
      },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: 'intake-1', review_unlocked: true, status: 'completed' }],
      }),
    });

    renderPage();

    expect(await screen.findByText('후기 남기기 →')).toBeInTheDocument();
    expect(screen.getByText('신청 완료')).toBeInTheDocument();
  });

  it('keeps review locked when intake is unlocked but not completed', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      session: { access_token: 'token' },
    });
    mockUseReportStatus.mockReturnValue({
      prescription: {
        done: true,
      },
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: 'intake-1', review_unlocked: true, status: 'submitted' }],
      }),
    });

    renderPage();

    expect(
      await screen.findByText('후기 작성은 컨설팅 완료 후 가능합니다.')
    ).toBeInTheDocument();
  });

  it('shows locked consulting CTA when prescription is incomplete and no intake exists', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: '처방전 완료 후 신청 가능' })).toBeDisabled();
  });

  it('shows apply CTA when prescription is complete and no intake exists', async () => {
    mockUseReportStatus.mockReturnValue({
      prescription: {
        done: true,
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '신청하기' })).toBeEnabled();
    });
  });
});
