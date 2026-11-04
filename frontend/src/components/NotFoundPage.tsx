import React, { useEffect } from 'react';
import { Home, Sparkles } from 'lucide-react';

interface NotFoundPageProps {
  isDark?: boolean;
  onGoHome: () => void;
  onNavigateToSimulator?: () => void;
  onNavigate?: (route: string) => void;
  requestedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  isDark = true,
  onGoHome,
  onNavigateToSimulator,
  onNavigate,
  requestedPath,
}) => {
  const currentPath =
    requestedPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = '404: Page Not Found — GitToScale';
    return () => {
      document.title =
        'GitToScale — Turn Code into Interactive System Architectures & Capacity Simulations';
    };
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-between font-sans relative overflow-hidden transition-colors duration-200 select-none ${
        isDark ? 'bg-[#000000] text-[#f4f4f5]' : 'bg-[#ffffff] text-[#0a0a0a]'
      }`}
    >
      {/* Top Left Editorial Micro-Copy */}
      <header className="p-6 sm:p-10 md:p-14 z-20">
        <div className="max-w-xl text-left space-y-1">
          <p className="text-sm sm:text-base md:text-[18px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            We’re not sure what happened there—sorry!
          </p>
          <p className="text-sm sm:text-base md:text-[18px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Check for typos, try again?
          </p>
          {currentPath && currentPath !== '/' && (
            <p className="pt-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
              Path: <span className="underline decoration-dotted">{currentPath}</span>
            </p>
          )}
        </div>
      </header>

      {/* Centerpiece Hero: Anti Average 404 Mascot & Numbers */}
      <main className="flex-1 flex items-center justify-center relative w-full px-4">
        <div className="relative w-full max-w-[620px] sm:max-w-[700px] flex items-center justify-center my-auto">
          {/* Main SVG Composition: 4 + 4 with Cat ears / silhouette behind blur cone */}
          <svg
            viewBox="0 0 668 459"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto max-h-[50vh] sm:max-h-[55vh] select-none"
          >
            {/* Left '4' */}
            <g
              className="transition-transform duration-300 ease-out hover:-translate-x-1"
              opacity="1"
            >
              <path
                d="M182.499 219.509H100V174.903L173.605 68.7441H234.947V178.292H260.018V219.509H234.947V258.118H182.477V219.509H182.499ZM184.064 178.292V125.604L148.295 178.292H184.064Z"
                className={isDark ? 'fill-[#3f3f46]' : 'fill-[#BDBEC0]'}
              />
            </g>

            {/* Right '4' */}
            <g
              className="transition-transform duration-300 ease-out hover:translate-x-1"
              opacity="1"
            >
              <path
                d="M490.27 219.509H407.771V174.903L481.378 68.7441H542.718V178.292H567.789V219.509H542.718V258.118H490.248V219.509H490.27ZM491.836 178.292V125.604L456.066 178.292H491.836Z"
                className={isDark ? 'fill-[#3f3f46]' : 'fill-[#BDBEC0]'}
              />
            </g>

            {/* Cat ears & head peak (fills between ears) */}
            <path
              d="M274.303 155.339C274.303 168.903 290.174 191.712 298.11 201.421H371.265C379.345 189.828 395.506 164.382 395.506 155.339C395.506 144.036 364.339 80.5645 359.145 80.5645C354.989 80.5645 340.676 99.1131 334.038 108.387C327.113 101.142 314.201 86.9052 309.353 82.0362C303.293 75.9499 274.303 138.384 274.303 155.339Z"
              className={isDark ? 'fill-[#ffffff]' : 'fill-[#000000]'}
            />
          </svg>

          {/* Frosted Spherical / Cone Lens (The transparent cone overlay) */}
          <div
            className="absolute aspect-square rounded-full flex items-center justify-center pointer-events-none transition-all"
            style={{
              width: '34%',
              marginTop: '-6%',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(9px)',
              WebkitBackdropFilter: 'blur(9px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(220, 220, 225, 0.9)',
              boxShadow: isDark
                ? '0 10px 30px rgba(0, 0, 0, 0.5)'
                : '0 8px 24px rgba(0, 0, 0, 0.06)',
            }}
          />

          {/* Foreground Cat Mascot Silhouette (Sitting with Tail) */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '46%',
              bottom: '1%',
              left: '26.8%',
            }}
          >
            <svg
              viewBox="0 0 307 297"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto drop-shadow-sm select-none"
            >
              <path
                d="M193.165 0C213.409 0 230.218 14.6228 233.632 33.873L230.924 39.0693L234.411 44.2148C242.033 56.2079 246.977 69.744 248.849 83.9531L254.337 125.689C256.406 141.311 262.198 156.216 271.235 169.121L289.288 194.91L289.266 194.845C303.399 215.007 309.409 239.732 306.121 264.109L301.744 296.568H84.5028C62.7265 295.134 41.9521 285.857 26.4256 270.366C-8.80853 235.213 -8.80853 177.986 26.4256 142.832C31.0858 138.161 38.6636 138.161 43.3455 142.832C48.0274 147.503 48.0274 155.064 43.3455 159.735C19.0868 183.939 17.541 222.372 38.7293 248.379C36.922 242.296 35.9198 235.865 35.9198 229.217C35.9198 202.276 51.9905 178.072 76.8807 167.578C82.9781 165.014 90.0123 167.839 92.5819 173.923C95.1512 180.006 92.3205 187.023 86.2235 189.587C70.2178 196.344 59.8739 211.901 59.8739 229.238C59.8739 244.686 68.0833 258.265 80.3651 265.848L80.1258 264.152C76.8594 239.775 82.8694 215.051 96.9803 194.889L115.033 169.1C124.092 156.194 129.884 141.289 131.931 125.668L137.42 83.9316C139.307 69.5417 144.369 55.8415 152.134 43.7539C152.127 43.6469 152.118 43.5399 152.112 43.4326C152.515 42.8148 152.922 42.1973 153.335 41.583C153.749 40.8347 154.264 39.9146 154.852 38.8838L152.568 34.5029C155.721 14.9486 172.921 0.000223463 193.165 0Z"
                className={isDark ? 'fill-[#ffffff]' : 'fill-[#000000]'}
              />
              <path
                d="M152.255 43.6268C152.211 42.9672 152.184 42.3033 152.172 41.6355C152.168 41.4014 152.166 41.1667 152.166 40.9316C152.166 18.5641 170.522 0.431641 193.166 0.431641C215.81 0.431641 234.166 18.5641 234.166 40.9316C234.166 41.963 234.127 42.9853 234.05 43.9973"
                stroke={isDark ? '#27272a' : '#E6E7E7'}
                strokeWidth="0.6"
              />
            </svg>
          </div>
        </div>
      </main>

      {/* Bottom Bar: Anti Average signature Pill Button ("Error") + Return Action */}
      <footer className="p-6 sm:p-10 md:p-14 z-20 flex items-center justify-between">
        {/* Left Side: Anti Average Pill Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoHome}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-base sm:text-lg font-bold tracking-tight transition-all duration-150 cursor-pointer shadow-xs active:scale-95 ${
              isDark
                ? 'bg-white text-black hover:bg-neutral-200'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
            title="Return to GitToScale"
          >
            {/* Mascot Icon */}
            <svg
              width="22"
              height="20"
              viewBox="0 0 59 52"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-auto"
            >
              <path d="M50.5681 50.5696C49.9671 50.1876 49.3871 49.6888 48.9189 49.0772C48.4507 48.4656 48.1439 47.7915 48.0583 47.1633C47.9622 46.4678 47.9017 44.5714 47.7806 42.1281C47.5323 37.1432 47.0147 31.8344 46.1044 26.6579C45.3406 22.3168 44.027 18.0645 42.2783 14.1287C41.838 13.1366 41.2829 12.1818 40.638 11.2821C39.993 10.3824 39.2687 9.55422 38.4831 8.81534C37.6976 8.07647 36.8631 7.43977 36.0004 6.92042C35.1377 6.40107 34.2625 6.00937 33.3986 5.76182C32.5348 5.51427 31.6966 5.41908 30.9067 5.47864C30.1169 5.5382 29.3892 5.75114 28.7442 6.1105C28.0992 6.46985 27.5511 6.96766 27.1143 7.59104C26.6775 8.21443 26.3644 8.94892 26.1867 9.77457C26.009 10.6002 25.9723 11.4988 26.0779 12.4485C26.1835 13.3981 26.4294 14.3789 26.8043 15.3667C27.1792 16.3545 27.6749 17.3276 28.2779 18.2618C28.8809 19.196 29.5777 20.0689 30.352 20.8576C31.1262 21.6463 31.9619 22.3332 32.8398 22.8988C33.7176 23.4644 34.6198 23.8942 35.5229 24.1706L36.0594 24.3168L36.0469 24.8722C36.003 26.8409 35.8423 28.7909 35.5684 30.6971C35.2944 32.6033 34.9126 34.4258 34.4377 36.1418L32.378 36.5182C30.8911 36.5182 29.4669 37.1079 28.4149 38.1598L23.1596 43.4152C22.5928 43.982 22.3921 44.8185 22.6368 45.5797L23.3959 47.9345C23.6657 48.7689 24.2157 49.4842 24.9518 49.9589L25.9013 50.5716C26.1229 50.7139 26.2568 50.9585 26.2568 51.222V51.2262C26.2568 51.6528 25.9096 52 25.483 52H21.4677L18.1551 45.4438C17.7871 44.7181 17.8038 43.8586 18.199 43.1476L20.0122 39.8851L14.9094 43.3922C13.7195 44.212 12.885 45.4542 12.5818 46.868L12.5755 46.9014C12.2723 48.3047 12.8453 49.7498 14.0248 50.5633C14.2381 50.7097 14.3699 50.9481 14.3699 51.2074V51.2283C14.3699 51.6549 14.0227 52.0021 13.5961 52.0021H8.3825V45.0318C8.3825 44.2497 8.56653 43.478 8.92205 42.7816L14.8739 31.1038C15.357 30.1523 15.5619 29.0857 15.4615 28.0233C15.3507 26.8543 14.487 25.8818 13.3305 25.6832C10.8502 25.2544 8.53098 24.0708 6.73038 22.2702C4.17064 19.7104 2.88031 16.218 3.17936 12.5582C3.3864 10.0298 4.38813 7.60812 6.03189 5.67786C8.40969 2.8818 11.7892 1.32588 15.4072 1.32588C16.457 1.32588 17.3019 2.19795 17.2559 3.25823C17.2119 4.24951 16.3503 5.0191 15.3591 5.02538C13.044 5.03792 10.8711 5.96228 9.25457 7.62904C7.70701 9.22469 6.83494 11.3829 6.83494 13.6039C6.83494 15.8917 7.72792 18.0416 9.34449 19.6582C9.73557 20.0492 10.1559 20.3943 10.6014 20.6975C9.96142 19.4386 9.59754 18.0165 9.59754 16.5087C9.59754 11.3934 13.7592 7.23169 18.8745 7.23169C22.4423 7.23169 25.734 9.31671 27.2627 12.5415C27.7249 13.5139 27.2627 14.6871 26.2317 15.0699C25.3157 15.4107 24.3161 14.9297 23.8853 14.0535C23.0825 12.1546 21.0504 10.8854 18.8745 10.8854C15.7725 10.8854 13.2514 13.4065 13.2514 16.5085C13.2514 17.6534 13.6026 18.7567 14.2545 19.6738C14.733 20.3479 15.4057 20.8703 16.1824 21.1899L50.5681 50.5696Z" />
            </svg>
            <span>Error</span>
          </button>
        </div>

        {/* Right Side: Quick Action Return Links */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (onNavigateToSimulator) {
                onNavigateToSimulator();
              } else {
                handleNavigate('/app');
              }
            }}
            className={`hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300'
                : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Simulator</span>
          </button>

          <button
            onClick={onGoHome}
            className={`inline-flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isDark
                ? 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-200'
                : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Go to Home"
          >
            <Home className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;
