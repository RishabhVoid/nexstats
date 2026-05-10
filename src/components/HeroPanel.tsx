"use client";

export default function HeroPanel() {
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="relative">
                <div className="mc-font text-xl mb-4 text-center">NexHack</div>
                <div className="grid grid-cols-3 gap-3">
                    <VoxelBlock delay="0ms" />
                    <VoxelBlock delay="120ms" />
                    <VoxelBlock delay="240ms" />
                    <VoxelBlock delay="360ms" />
                    <VoxelBlock delay="480ms" />
                    <VoxelBlock delay="600ms" />
                    <VoxelBlock delay="720ms" />
                    <VoxelBlock delay="840ms" />
                    <VoxelBlock delay="960ms" />
                </div>
                <p className="mt-4 text-center text-muted text-sm">
                    Stats mined in real time. Craft your win.
                </p>
            </div>
        </div>
    );
}

function VoxelBlock({ delay }: { delay: string }) {
    return (
        <div
            className="relative size-24 sm:size-28 md:size-32 pixel"
            style={{ animationDelay: delay }}
        >
            <div className="absolute inset-0 rounded-md bg-[conic-gradient(from_90deg,#2f8a4c,#3ba55d,#2f8a4c)] border border-[var(--line-2)] shadow-[var(--shadow-soft)] animate-[voxel-bob_1600ms_ease-in-out_infinite]"></div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-2 rounded-full bg-black/40 blur-sm"></div>
        </div>
    );
};