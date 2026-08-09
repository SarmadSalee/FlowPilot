import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button, Modal } from "@/components/ui";

const OUTPUT_SIZE = 512;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

async function cropImage(src: string, pixel: Area): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(image, pixel.x, pixel.y, pixel.width, pixel.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function CropAvatarModal({
  open,
  src,
  onCancel,
  onSave,
}: {
  open: boolean;
  src: string;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setPixels(null);
      setBusy(false);
    }
  }, [open, src]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  const save = async () => {
    if (!pixels || busy) return;
    setBusy(true);
    try {
      onSave(await cropImage(src, pixels));
    } catch {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Crop profile photo"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            Save photo
          </Button>
        </>
      }
    >
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-line bg-surface-soft">
        {open && (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <ZoomOut className="size-4 shrink-0 text-ink-faint" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-[#4F46E5]"
        />
        <ZoomIn className="size-4 shrink-0 text-ink-faint" />
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">Drag to reposition, use the slider to zoom.</p>
    </Modal>
  );
}