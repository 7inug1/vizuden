import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrescriptionResultPage from './PrescriptionResultPage';

const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockReadPrescriptionSaved = vi.fn(() => null);
const mockLocationState = vi.fn();
const mockParams = vi.fn(() => ({ reportId: 'report-1' }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocationState(),
    useParams: () => mockParams(),
  };
});

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/prescriptionStorage', () => ({
  readPrescriptionSaved: () => mockReadPrescriptionSaved(),
}));

vi.mock('../components/SiteHeader', () => ({
  default: ({ onLogoClick }) => (
    <button type="button" onClick={onLogoClick}>
      header
    </button>
  ),
}));

vi.mock('../components/ConsultingBeforeAfterCard', () => ({
  default: () => <div>consulting-card</div>,
}));

vi.mock('../components/ServiceStepChrome', () => ({
  StepNumber: ({ n }) => <div>{n}</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

vi.mock('../data/typeImages', () => ({
  typeImages: { ICMT: '/mock-icmt.png' },
}));

function makeLocationState(overrides = {}) {
  return {
    pathname: '/prescription/result/report-1',
    state: {
      title: '테스트 처방전',
      fromType: 'ICMT',
      reportId: 'report-1',
      report: {
        title: '테스트 처방전',
        direction: '무심하지만 기준은 분명한 방향',
        criteria: [{ title: '기준 1', detail: '테일러드한 상의를 우선합니다.' }],
        bodyGuide: '기장과 실루엣의 기준을 유지합니다.',
        stylingFormula: {
          intro: '바로 써먹는 조합입니다.',
          formulas: [{ title: '공식 1', detail: '상의 + 데님 + 로퍼' }],
          actionPlan: { thisWeek: '하의 점검', thisMonth: '', threeMonths: '' },
        },
        recommendations: {
          practical: {
            intro: '실제로 사기 쉬운 제품군입니다.',
            categories: [],
          },
          reference: '브랜드를 넓게 참고합니다.',
        },
      },
      fitPics: [],
      ...overrides,
    },
  };
}

describe('PrescriptionResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState.mockReturnValue(makeLocationState());
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <PrescriptionResultPage />
      </MemoryRouter>
    );
  }

  it('shows sticky auth CTA for logged-out users', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    renderPage();

    expect(await screen.findByText('보고서를 저장하려면 로그인 또는 회원가입이 필요합니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인 / 회원가입' })).toBeInTheDocument();
  });

  it('hides sticky auth CTA for logged-in users', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    renderPage();

    expect(await screen.findByText('테스트 처방전')).toBeInTheDocument();
    expect(screen.queryByText('보고서를 저장하려면 로그인 또는 회원가입이 필요합니다.')).not.toBeInTheDocument();
  });

  it('renders uploaded fit pictures and respects a two-column grid', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockLocationState.mockReturnValue(
      makeLocationState({
        fitPics: [
          { name: 'look-1.jpg', signedUrl: 'https://example.com/look-1.jpg' },
          { name: 'look-2.jpg', signedUrl: 'https://example.com/look-2.jpg' },
        ],
      })
    );

    const { container } = renderPage();

    expect(await screen.findByText('내가 올린 착장 사진')).toBeInTheDocument();
    expect(screen.getByText('look-1.jpg')).toBeInTheDocument();
    expect(screen.getByText('look-2.jpg')).toBeInTheDocument();

    const grid = container.querySelector('[style*="repeat(2, minmax(0, 1fr))"]');
    expect(grid).toBeTruthy();
  });
});

