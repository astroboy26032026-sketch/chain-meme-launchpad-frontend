// src/pages/create.tsx
import React from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import Modal from '@/components/notifications/Modal';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ChevronDownIcon, ChevronUpIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useCreateTokenFlow, normalizeSymbol } from '@/hooks/useCreateTokenFlow';

const CreateToken: React.FC = () => {
  const flow = useCreateTokenFlow();

  return (
    <Layout>
      <SEO
        title="Create Your Own Coin - CosmoX"
        description="Launch a coin that is instantly tradable — fair launch"
        image="/seo/create.jpg"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flow.step === 3 && (
          <h1 className="text-xl sm:text-2xl font-bold text-orange mb-6 text-center">Buy</h1>
        )}

        {/* ==================== STEP 1 – BASIC ==================== */}
        {flow.step === 1 && (
          <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden" style={{ background: 'var(--card)' }}>
            <div className="px-6 py-4 border-b border-[var(--card-border)] text-center">
              <h1 className="text-base sm:text-lg font-extrabold tracking-[0.12em] uppercase" style={{ color: 'var(--primary)' }}>
                Create a New Coin
              </h1>
            </div>

            <input
              ref={flow.fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={flow.onImagePicked}
              disabled={flow.isUploading}
            />

            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr]">
              {/* LEFT: Image preview */}
              <div className="p-5 border-b sm:border-b-0 sm:border-r border-[var(--card-border)] flex flex-col items-center gap-3">
                <div
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--card2)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--primary)] transition-colors overflow-hidden relative"
                  onClick={flow.openFilePicker}
                  onDragOver={flow.onDragOver}
                  onDrop={flow.onDrop}
                >
                  {flow.tokenImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={flow.tokenImageUrl} alt="Token preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-wide">Drag &amp; Drop Here</p>
                      <p className="text-[10px] text-gray-500 text-center mt-1 px-2">Upload any picture or gif up to 5 MB</p>
                    </>
                  )}
                  {flow.isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">Uploading...</span>
                    </div>
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="font-extrabold text-sm truncate" style={{ color: 'var(--primary)' }}>
                    {flow.tokenName || 'Coin Name'}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">TITLE</p>
                </div>
              </div>

              {/* RIGHT: Form fields */}
              <div className="p-5 flex flex-col gap-4">
                {/* Ticker */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Ticker</label>
                  <input
                    value={flow.tokenSymbol}
                    onChange={(e) => { flow.setTokenSymbol(normalizeSymbol(e.target.value)); flow.resetIdempotencyKeys(); }}
                    className="w-full py-2.5 px-3 bg-[var(--card2)] border border-[var(--card-border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder-gray-500"
                    placeholder="A-Z0-9, 2-10 chars"
                  />
                  {!flow.SYMBOL_RE.test(flow.symbolFinal) && flow.symbolFinal.length > 0 && (
                    <div className="text-[10px] text-red-400 mt-1">
                      Symbol must be uppercase alphanumeric, {flow.SYMBOL_MIN}–{flow.SYMBOL_MAX} characters
                    </div>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Name</label>
                  <input
                    value={flow.tokenName}
                    onChange={(e) => { flow.setTokenName(e.target.value); flow.resetIdempotencyKeys(); }}
                    className="w-full py-2.5 px-3 bg-[var(--card2)] border border-[var(--card-border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder-gray-500"
                    placeholder="Enter coin name"
                  />
                </div>

                {/* About */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">About</label>
                  <textarea
                    value={flow.tokenDescription}
                    onChange={(e) => { flow.setTokenDescription(e.target.value); flow.resetIdempotencyKeys(); }}
                    rows={3}
                    className="w-full py-2.5 px-3 bg-[var(--card2)] border border-[var(--card-border)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder-gray-500 resize-none"
                    placeholder="Describe your coin"
                  />
                </div>

                {/* Choose File */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={flow.openFilePicker} disabled={flow.isUploading}
                    className="shrink-0 px-4 py-2 rounded-lg text-xs font-extrabold tracking-wider border border-[var(--card-border)] bg-[var(--card2)] text-white hover:bg-[var(--card-hover)] transition disabled:opacity-50 uppercase">
                    Choose File
                  </button>
                  <span className="text-[11px] text-gray-400">Upload any picture or gif up to 5 MB</span>
                </div>

                {/* Social Links */}
                <div className="border border-[var(--card-border)] rounded-lg overflow-hidden">
                  <button type="button" onClick={() => flow.setIsSocialExpanded((v) => !v)}
                    className="w-full flex justify-between items-center px-4 py-2.5 bg-[var(--card2)] text-white hover:bg-[var(--card-hover)] transition-colors">
                    <span className="font-semibold text-xs text-gray-300">Social Links</span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      (optional) {flow.isSocialExpanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  {flow.isSocialExpanded && (
                    <div className="p-4 bg-[var(--card)] grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'twitter', label: 'Twitter', value: flow.twitter, setter: flow.setTwitter },
                        { id: 'telegram', label: 'Telegram', value: flow.telegram, setter: flow.setTelegram },
                      ].map((i) => (
                        <div key={i.id}>
                          <label className="block text-[10px] font-semibold text-gray-400 mb-1">{i.label}</label>
                          <input value={i.value}
                            onChange={(e) => { i.setter(e.target.value); flow.resetIdempotencyKeys(); }}
                            className="w-full py-2 px-3 bg-[var(--card2)] border border-[var(--card-border)] rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 placeholder-gray-600"
                            placeholder="optional" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* NSFW */}
                <div className="flex items-center gap-2">
                  <input id="isNsfw" type="checkbox" checked={flow.isNSFW}
                    onChange={(e) => { flow.setIsNSFW(e.target.checked); flow.resetIdempotencyKeys(); }} />
                  <label htmlFor="isNsfw" className="text-xs text-gray-400">Mark as NSFW</label>
                </div>

                {/* NEXT */}
                <button
                  className="btn btn-primary w-full py-3 rounded-xl disabled:opacity-50 font-extrabold tracking-widest text-sm uppercase mt-1"
                  disabled={!flow.canGoNextStep1 || flow.creationStep === 'drafting' || flow.isBusy}
                  onClick={flow.handleCreateDraftAndNext}>
                  {flow.creationStep === 'drafting' ? 'Creating Draft...' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3 – BUY ==================== */}
        {flow.step === 3 && (
          <div className="space-y-6">
            <div className="text-left">
              <div className="text-sm font-semibold text-[var(--foreground)]/90">Tip:</div>
              <div className="text-[14px] text-[var(--foreground)]/75">Optional: Make an initial buy to gain the most from your token</div>
            </div>

            <div className="rounded-3xl bg-[var(--card)] border-thin p-6 shadow-lg">
              <div className="text-center text-4xl sm:text-6xl font-extrabold tracking-wide select-none text-[var(--foreground)]/25">
                {flow.buyAmount.toFixed(2)}
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0.1, 0.5, 1].map((v) => (
                  <button key={v} type="button" onClick={() => flow.setBuyAmount(v)}
                    className="rounded-xl bg-[var(--card2)] text-[var(--foreground)]/90 py-3 font-semibold border-thin hover:bg-[var(--card-hover)] transition">
                    {v}
                  </button>
                ))}
                <button type="button" onClick={() => flow.setBuyAmount(0)}
                  className="rounded-xl bg-[var(--card2)] text-[var(--foreground)]/90 py-3 font-semibold border-thin hover:bg-[var(--card-hover)] transition">
                  MAX
                </button>
              </div>
              <div className="mt-4">
                <button type="button" onClick={flow.handleBuy}
                  disabled={!flow.draft?.draftId || flow.buyAmount <= 0 || flow.creationStep === 'finalizing' || flow.isBusy}
                  className="btn btn-primary w-full py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                  {flow.creationStep === 'finalizing' ? 'Creating & Buying...' : 'BUY'}
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button type="button" onClick={() => flow.setStep(1)} disabled={flow.isBusy} className="btn-secondary w-1/2">
                Back
              </button>
              <button type="button" onClick={flow.handleCreateWithoutBuy}
                disabled={!flow.draft?.draftId || flow.creationStep === 'finalizing' || flow.isBusy}
                className="btn btn-primary w-1/2 disabled:opacity-50">
                {flow.creationStep === 'finalizing' ? 'Finalizing...' : 'Create Without Buying'}
              </button>
            </div>
          </div>
        )}

        {/* Connect Wallet Modal */}
        {flow.showConnectWalletModal && (
          <Modal isOpen={flow.showConnectWalletModal} onClose={flow.closeConnectWalletModal}>
            <div className="w-[92vw] max-w-[520px] rounded-3xl bg-[#0f1420] border border-white/10 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4">
                <button type="button" onClick={flow.closeConnectWalletModal}
                  className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition" aria-label="Back">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" onClick={flow.closeConnectWalletModal}
                  className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition" aria-label="Close">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className="px-6 pb-7 pt-3">
                <div className="flex justify-center mt-3">
                  <div className="h-16 w-16 rounded-full border-4 border-red-500/80 flex items-center justify-center">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 17h.01" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                    </svg>
                  </div>
                </div>
                <div className="mt-5 text-center">
                  <div className="text-lg sm:text-xl font-semibold text-white">Connect your wallet</div>
                  <div className="mt-2 text-sm text-white/60">Please connect your wallet to upload an image and continue creating your token.</div>
                </div>
                <div className="mt-5 flex justify-center">
                  <div className="w-full max-w-[360px] flex justify-center [&_.wallet-adapter-button]:w-full [&_.wallet-adapter-button]:h-12 [&_.wallet-adapter-button]:rounded-2xl [&_.wallet-adapter-button]:px-5 [&_.wallet-adapter-button]:font-semibold [&_.wallet-adapter-button]:transition [&_.wallet-adapter-button]:bg-[var(--primary)] [&_.wallet-adapter-button]:text-black hover:[&_.wallet-adapter-button]:bg-[var(--primary-hover)] [&_.wallet-adapter-button]:border-0 [&_.wallet-adapter-button]:justify-center [&_.wallet-adapter-button]:text-center [&_.wallet-adapter-button]:gap-2 [&_.wallet-adapter-button]:whitespace-nowrap">
                    <WalletMultiButton />
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Prevent Navigation Modal */}
        {flow.showPreventNavigationModal && (
          <Modal isOpen={flow.showPreventNavigationModal} onClose={() => {}}>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">Please Wait</h3>
              <p className="text-sm text-gray-500">Your token is being finalized. Please do not close or navigate away.</p>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default CreateToken;
