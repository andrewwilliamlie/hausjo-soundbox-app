'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { Upload } from './Upload';

/*
 * Live selfie with a liveness check that runs on the phone (MediaPipe Face Landmarker, files self-hosted under
 * /mediapipe). The merchant does two random actions (blink, turn head, smile), then looks straight at the camera
 * holding the e-KTP and the selfie is taken from the live video. The video never leaves the phone; only the final
 * selfie is uploaded. This raises the bar against old photos and photos of photos; it is not bank-grade anti-spoofing.
 */

type Challenge = 'blink' | 'turn' | 'smile';
const TEXT: Record<Challenge, [string, string]> = {
  blink: ['Kedipkan mata', 'Pejamkan kedua mata sebentar'],
  turn: ['Tolehkan kepala', 'Ke kiri atau kanan, lalu kembali'],
  smile: ['Tersenyum', 'Senyum lebar sebentar']
};

type Landmark = { x: number; y: number };
type Shape = { categoryName: string; score: number };
type Face = { lm: Landmark[]; shapes: Record<string, number> };
type Phase = 'intro' | 'loading' | 'running' | 'capture' | 'uploading' | 'done' | 'failed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let landmarkerPromise: Promise<any> | null = null;
async function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
    const make = (delegate: 'GPU' | 'CPU') =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate },
        outputFaceBlendshapes: true,
        runningMode: 'VIDEO',
        numFaces: 2 // the photo on the e-KTP can count as a second face; the largest one is the merchant
      });
    try {
      return await make('GPU');
    } catch {
      return await make('CPU');
    }
  })().catch((e) => {
    landmarkerPromise = null;
    throw e;
  });
  return landmarkerPromise;
}

function pickTwo(): Challenge[] {
  const all: Challenge[] = ['blink', 'turn', 'smile'];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.slice(0, 2);
}

const width = (lm: Landmark[]) => Math.max(...lm.map((p) => p.x)) - Math.min(...lm.map((p) => p.x));
/** 0.5 when facing the camera; lower/higher when the head is turned (nose between the cheek edges). */
const yaw = (lm: Landmark[]) => (lm[1].x - lm[234].x) / (lm[454].x - lm[234].x || 1);
const eyesClosed = (s: Record<string, number>) => Math.min(s.eyeBlinkLeft ?? 0, s.eyeBlinkRight ?? 0);
const smile = (s: Record<string, number>) => ((s.mouthSmileLeft ?? 0) + (s.mouthSmileRight ?? 0)) / 2;
const neutral = (f: Face) => Math.abs(yaw(f.lm) - 0.5) < 0.12 && eyesClosed(f.shapes) < 0.3 && smile(f.shapes) < 0.45;

export default function LiveSelfie({ done, onDone }: { done: boolean; onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const [phase, setPhase] = useState<Phase>(done ? 'done' : 'intro');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [fails, setFails] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [noCam, setNoCam] = useState(false);

  function stop() {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }
  useEffect(() => stop, []);
  // Start downloading the face-check engine (~13 MB, cached afterwards) while the merchant is still on the KTP part.
  useEffect(() => {
    if (!done) getLandmarker().catch(() => {});
  }, [done]);

  function fail(msg: string) {
    stop();
    setError(msg);
    setFails((n) => n + 1);
    setPhase('failed');
  }

  async function start() {
    setError('');
    setNoCam(false);
    setPhase('loading');
    const list = pickTwo();
    setChallenges(list);
    setStep(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocam');
      const [lmk, media] = await Promise.all([
        getLandmarker(),
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      ]);
      stream.current = media;
      const v = video.current!;
      v.srcObject = media;
      await v.play();
      setPhase('running');
      run(lmk, list);
    } catch (e) {
      const name = (e as Error)?.name;
      setNoCam(true);
      fail(name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan browser, lalu coba lagi.' : 'Kamera atau pemeriksa wajah tidak bisa dibuka di perangkat ini.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function run(lmk: any, list: Challenge[]) {
    const t0 = performance.now();
    let idx = 0; // 0..list.length-1 challenges, then list.length = final capture
    let armed = false; // a challenge counts only after a neutral face was seen first
    let stepStart = t0;
    let lastFace = t0;
    let steadySince = 0;
    let lastTs = 0;

    const tick = () => {
      const v = video.current;
      if (!v || !stream.current) return;
      const now = performance.now();
      if (now - lastTs < 70 || v.readyState < 2) {
        raf.current = requestAnimationFrame(tick);
        return;
      }
      lastTs = now;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = lmk.detectForVideo(v, now);
      const faces: Face[] = (res.faceLandmarks ?? []).map((lm: Landmark[], i: number) => ({
        lm,
        shapes: Object.fromEntries(((res.faceBlendshapes?.[i]?.categories ?? []) as Shape[]).map((c) => [c.categoryName, c.score]))
      }));
      const face = faces.sort((a, b) => width(b.lm) - width(a.lm))[0];

      if (!face) {
        if (now - lastFace > 1200) setHint('Wajah tidak terlihat. Posisikan wajah di dalam oval.');
        if (now - lastFace > 15000) return fail('Wajah tidak terdeteksi. Coba di tempat yang lebih terang.');
        raf.current = requestAnimationFrame(tick);
        return;
      }
      lastFace = now;
      const size = width(face.lm);
      if (size < 0.22) setHint('Dekatkan wajah ke kamera');
      else setHint('');

      if (idx < list.length) {
        const c = list[idx];
        if (!armed && neutral(face)) armed = true;
        const hit =
          armed &&
          ((c === 'blink' && eyesClosed(face.shapes) > 0.5) ||
            (c === 'smile' && smile(face.shapes) > 0.6) ||
            (c === 'turn' && Math.abs(yaw(face.lm) - 0.5) > 0.2));
        if (hit) {
          idx++;
          armed = false;
          stepStart = now;
          setStep(idx);
          if (idx === list.length) setPhase('capture');
        } else if (now - stepStart > 12000) return fail('Gerakan belum terdeteksi. Coba lagi dan ikuti petunjuk di layar.');
      } else {
        // Final: facing the camera, eyes open, close enough, held still for a moment.
        const ok = neutral(face) && size >= 0.22;
        if (!ok) steadySince = 0;
        else if (!steadySince) steadySince = now;
        else if (now - steadySince > 700) {
          capture(v, list, Math.round(now - t0));
          return;
        }
        if (now - stepStart > 15000) return fail('Belum bisa mengambil foto. Hadap lurus ke kamera dan coba lagi.');
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  async function capture(v: HTMLVideoElement, list: Challenge[], ms: number) {
    const scale = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    canvas.getContext('2d')!.drawImage(v, 0, 0, canvas.width, canvas.height);
    stop();
    setPhase('uploading');
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.9));
    if (!blob) return fail('Gagal mengambil foto. Coba lagi.');
    const fd = new FormData();
    fd.append('kind', 'SELFIE');
    fd.append('file', new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
    fd.append('liveness', JSON.stringify({ passed: true, challenges: list, ms }));
    try {
      const res = await fetch('/api/app/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah');
      setPreview(URL.createObjectURL(blob));
      setPhase('done');
      onDone();
    } catch (e) {
      fail((e as Error).message);
    }
  }

  const active = phase === 'running' || phase === 'capture' || phase === 'loading';
  const current = phase === 'capture' ? null : challenges[step];

  if (fallback) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Upload kind="SELFIE" label="Selfie dengan e-KTP" icon="selfie" front done={done}
          extra={{ liveness: JSON.stringify({ passed: false, note: error || 'Merchant memilih unggah foto' }) }} onDone={onDone} />
        <button type="button" className="hint" onClick={() => { setFallback(false); setPhase('intro'); }} style={{ background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer', minHeight: 40 }}>Coba cek wajah lagi</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="live-frame" style={{ display: active ? 'block' : 'none' }}>
        <video ref={video} playsInline muted />
        <div className="live-oval" aria-hidden="true" />
        <div className="live-guide" role="status" aria-live="polite">
          {phase === 'loading' && <strong>Menyiapkan kamera…</strong>}
          {phase === 'running' && current && (
            <span key={step} className="pop" style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <strong style={{ fontSize: 18 }}>{TEXT[current][0]}</strong>
              <span style={{ fontSize: 12.5 }}>{TEXT[current][1]}</span>
            </span>
          )}
          {phase === 'capture' && (
            <span className="pop" style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <strong style={{ fontSize: 17 }}>Hadap lurus, tahan</strong>
              <span style={{ fontSize: 12.5 }}>e-KTP di samping wajah · foto diambil otomatis</span>
            </span>
          )}
          {hint && <span style={{ fontSize: 12.5, color: '#fde68a' }}>{hint}</span>}
        </div>
        <div className="live-steps" aria-hidden="true">
          {[...challenges, 'foto'].map((c, i) => <i key={i} className={i < step ? 'on' : i === step ? 'now' : ''} />)}
        </div>
      </div>

      {phase === 'intro' && (
        <button type="button" className="upload tap" onClick={start} style={{ minHeight: 132 }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Icon name="selfie" size={30} />
            <span>Mulai selfie dengan cek wajah</span>
            <span style={{ fontSize: 11.5, fontWeight: 500 }}>Pegang e-KTP · ikuti 2 gerakan singkat · foto diambil otomatis</span>
          </span>
        </button>
      )}

      {phase === 'uploading' && (
        <div className="upload busy" style={{ minHeight: 132 }}>
          <span className="scanline" aria-hidden="true" />
          <span style={{ position: 'relative' }}>Mengunggah selfie…</span>
        </div>
      )}

      {phase === 'done' && (
        <div className="upload done" style={{ minHeight: 132 }}>
          {preview && <img src={preview} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, transform: 'scaleX(-1)' }} />}
          <span style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span className="donemark"><Icon name="check" size={18} strokeWidth={3} /></span>
            <span>Selfie & cek wajah berhasil</span>
            <button type="button" onClick={() => { setPreview(null); setPhase('intro'); }} style={{ fontSize: 12, fontWeight: 600, color: 'var(--ok)', background: 'none', border: 0, textDecoration: 'underline', cursor: 'pointer', minHeight: 32 }}>Ulangi selfie</button>
          </span>
        </div>
      )}

      {phase === 'failed' && (
        <div className="card fade-in" style={{ gap: 10, borderColor: '#fec84b', background: '#fffcf5' }}>
          <span className="err" role="alert" style={{ color: '#93370d' }}>{error}</span>
          <button type="button" className="btn btn-primary" onClick={start}>Coba lagi</button>
          {(fails >= 2 || noCam) && (
            <button type="button" className="btn btn-ghost" onClick={() => setFallback(true)}>Unggah foto selfie saja</button>
          )}
        </div>
      )}
    </div>
  );
}
