
import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera, Environment, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../context';
import { Card } from './Layout';
import { formatCurrency } from '../utils';
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, Activity, CheckCircle2, AlertCircle, Smartphone, Clock, Droplets, PieChart, Loader2
} from 'lucide-react';

interface Slice3DProps {
  startAngle: number;
  endAngle: number;
  color: string;
  data: { name: string; value: number };
  totalValue: number;
}

const Slice3D: React.FC<Slice3DProps> = ({ 
  startAngle, 
  endAngle, 
  color, 
  data, 
  totalValue
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);
  
  const innerRadius = 1.2;
  const outerRadius = 2.5;
  const depth = 0.6;

  const shape = useMemo(() => {
    // PROTEÇÃO CRÍTICA: Se THREE não estiver disponível ou parâmetros forem inválidos, não gera geometria.
    if (typeof THREE === 'undefined' || !THREE.Shape) return null;

    const start = isNaN(startAngle) ? 0 : startAngle;
    const end = isNaN(endAngle) ? (start + 0.01) : endAngle;
    const safeEnd = Math.abs(end - start) < 0.001 ? start + 0.001 : end;
    
    try {
        const s = new THREE.Shape();
        s.absarc(0, 0, outerRadius, start, safeEnd, false);
        s.absarc(0, 0, innerRadius, safeEnd, start, true);
        return s;
    } catch (e) {
        console.error("Erro ao gerar geometria 3D:", e);
        return null;
    }
  }, [startAngle, endAngle]);

  const extrudeSettings = useMemo(() => ({
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const midAngle = (startAngle + endAngle) / 2;
    const targetX = active ? Math.cos(midAngle) * 0.4 : (hovered ? Math.cos(midAngle) * 0.15 : 0);
    const targetY = active ? Math.sin(midAngle) * 0.4 : (hovered ? Math.sin(midAngle) * 0.15 : 0);
    const targetZ = hovered || active ? 0.2 : 0;

    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.15;
    meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.15;
    meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.15;
    
    if (meshRef.current.material) {
        const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
        if (material.emissiveIntensity !== undefined) {
           const targetEmissiveIntensity = hovered ? 0.4 : 0;
           material.emissiveIntensity += (targetEmissiveIntensity - material.emissiveIntensity) * 0.1;
        }
    }
  });

  if (!shape) return null;

  return (
    <group>
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setActive(!active);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        castShadow
        receiveShadow
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshPhysicalMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={0}
          roughness={0.3} 
          metalness={0.2}
          reflectivity={0.5}
          clearcoat={0.5}
        />
        
        {(hovered || active) && (
          <Html position={[Math.cos((startAngle + endAngle)/2) * 2.8, Math.sin((startAngle + endAngle)/2) * 2.8, 0.4]} center pointerEvents="none">
            <div className="bg-github-surface/95 backdrop-blur-md border border-github-border p-2 rounded-lg shadow-2xl text-[10px] whitespace-nowrap animate-in zoom-in-50">
               <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-black uppercase text-github-text">{data.name}</span>
               </div>
               <div className="font-mono font-bold text-github-text">
                  {formatCurrency(data.value)}
                  <span className="text-github-muted ml-1 font-normal">({((data.value / (totalValue || 1)) * 100).toFixed(1)}%)</span>
               </div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
};

const Pie3DScene = ({ data }: { data: any[] }) => {
  const totalValue = useMemo(() => {
      const val = data.reduce((acc, d) => acc + (d.value || 0), 0);
      return val > 0 ? val : 0;
  }, [data]);
  
  const slices = useMemo(() => {
    if (totalValue <= 0) return [];
    let currentAngle = 0;
    return data.map(d => {
      const sweepAngle = ((d.value || 0) / totalValue) * Math.PI * 2;
      const start = currentAngle;
      const end = currentAngle + sweepAngle;
      currentAngle = end;
      return { ...d, startAngle: start, endAngle: end };
    });
  }, [data, totalValue]);

  if (totalValue === 0 || slices.length === 0) return null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, -4, 8]} fov={35} />
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={12} 
        autoRotate={false}
        makeDefault
      />
      
      <ambientLight intensity={0.6} />
      <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#58a6ff" />
      
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
        <group rotation={[-Math.PI / 3.5, 0, 0]}>
          {slices.map((slice, i) => (
            <Slice3D 
              key={`${slice.name}-${i}-${slice.value}`} 
              data={slice}
              color={slice.color}
              startAngle={slice.startAngle}
              endAngle={slice.endAngle}
              totalValue={totalValue}
            />
          ))}
        </group>
      </Float>
      
      <Environment preset="city" />
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={0.3} 
        scale={12} 
        blur={2} 
        far={10} 
        color="#000000" 
      />
    </>
  );
};

const HealthThermometer = () => {
  const { getOverallBalanceAtDate, healthThresholds } = useApp();
  const balance = getOverallBalanceAtDate(new Date()) || 0;
  const [tilt, setTilt] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        setTilt(prev => prev + (e.gamma! - prev) * 0.15);
      }
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setPermissionStatus('prompt');
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
        setPermissionStatus('granted');
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const requestPermission = async () => {
    try {
      const res = await (DeviceOrientationEvent as any).requestPermission();
      if (res === 'granted') {
        setPermissionStatus('granted');
        window.addEventListener('deviceorientation', (e) => {
            if (e.gamma !== null) setTilt(e.gamma);
        });
      } else {
        setPermissionStatus('denied');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const healthStatus = useMemo(() => {
    let pct = 0;
    const critical = healthThresholds?.critical ?? -500;
    const attention = healthThresholds?.attention ?? 0;
    const moderate = healthThresholds?.moderate ?? 1000;
    const good = healthThresholds?.good ?? 2000;

    if (balance <= critical) {
      pct = 15;
      return { label: 'Crítico', color: '#f85149', pct, message: 'Nível crítico! Reorganize seus gastos.' };
    } else if (balance <= attention) {
      pct = 35;
      return { label: 'Atenção', color: '#d29922', icon: AlertCircle, pct, message: 'Alerta! Cuidado com as contas.' };
    } else if (balance <= moderate) {
      pct = 55;
      return { label: 'Moderado', color: '#bf8700', icon: Activity, pct, message: 'Estabilidade básica atingida.' };
    } else if (balance <= good) {
      pct = 80;
      return { label: 'Bom', color: '#3fb950', icon: CheckCircle2, pct, message: 'Ótimo! Continue economizando.' };
    } else {
      pct = 100;
      return { label: 'Excelente', color: '#238636', icon: CheckCircle2, pct, message: 'Saúde financeira impecável!' };
    }
  }, [balance, healthThresholds]);

  return (
    <Card className="p-6 relative overflow-hidden group min-h-[200px] border-github-border flex items-stretch gap-6">
      <div className="flex-1 flex flex-col justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={16} className="text-github-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-github-muted">Status de Saúde</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black transition-colors duration-500" style={{ color: healthStatus.color }}>
                {healthStatus.label}
            </span>
          </div>
          <p className="text-sm text-github-muted mt-2 font-medium">
            {healthStatus.message}
          </p>
        </div>

        <div className="mt-4">
           <p className="text-[10px] text-github-muted font-black uppercase tracking-tighter">Patrimônio Líquido Atual</p>
           <p className="text-2xl font-mono font-bold text-github-text">{formatCurrency(balance)}</p>
           {permissionStatus === 'prompt' && (
             <button 
                onClick={requestPermission}
                className="mt-2 text-[9px] font-black uppercase flex items-center gap-1 text-github-primary hover:underline opacity-60 hover:opacity-100"
             >
                <Smartphone size={10} /> Ativar Sensores de Movimento
             </button>
           )}
        </div>
      </div>

      <div className="relative w-16 flex flex-col items-center justify-end py-2">
        <div className="relative w-8 h-full bg-github-bg border-2 border-github-border rounded-full overflow-hidden shadow-inner flex flex-col justify-end">
          <div 
            className="w-full transition-all duration-1000 ease-out relative"
            style={{ 
              height: `${healthStatus.pct}%`, 
              backgroundColor: healthStatus.color,
              boxShadow: `0 0 20px ${healthStatus.color}44`
            }}
          >
            <div 
              className="absolute top-0 left-[-50%] right-[-50%] h-4 transition-transform duration-300"
              style={{ 
                backgroundColor: healthStatus.color,
                borderRadius: '50%',
                transform: `translateX(${tilt * 0.4}px) translateY(-50%)`,
                filter: 'brightness(1.1)'
              }}
            />
            <div className="absolute inset-y-0 left-1 w-1 bg-white/20 rounded-full" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full flex justify-center">
                    <div className="w-3 h-[1px] bg-github-text" />
                </div>
            ))}
          </div>
        </div>
        <div 
            className="w-10 h-10 rounded-full border-2 border-github-border -mt-4 z-20 transition-colors duration-500" 
            style={{ backgroundColor: healthStatus.color, boxShadow: `0 4px 10px ${healthStatus.color}44` }}
        >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-white/20 pointer-events-none" />
        </div>
      </div>
    </Card>
  );
};

export const Dashboard = () => {
  const { transactions, getDashboardStats, getOverallBalanceAtDate, categories, isLoading } = useApp();
  const today = useMemo(() => new Date(), []);
  const stats = useMemo(() => getDashboardStats(today), [getDashboardStats, today, transactions]);
  const currentTotalBalance = getOverallBalanceAtDate(today) || 0;
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    let timeout: any;
    const checkThree = () => {
      // Verifica se a biblioteca THREE está no window (carregada via Import Map)
      if (typeof (window as any).THREE !== 'undefined' || (typeof THREE !== 'undefined' && THREE.Shape)) {
        setThreeLoaded(true);
      } else {
        timeout = setTimeout(checkThree, 150);
      }
    };
    checkThree();
    return () => clearTimeout(timeout);
  }, []);

  const categoryData = useMemo(() => {
    if (!categories || !categories.length || !transactions || transactions.length === 0) return [];
    
    return categories.map(cat => {
      const total = transactions
        .filter(t => {
            if (!t.date || t.type !== 'expense') return false;
            const tDate = new Date(t.date);
            if (isNaN(tDate.getTime())) return false;
            return t.categoryId === cat.id && 
                   tDate.getUTCMonth() === today.getUTCMonth() && 
                   tDate.getUTCFullYear() === today.getUTCFullYear();
        })
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      return { name: cat.name, value: total, color: cat.color };
    }).filter(d => d.value > 0);
  }, [categories, transactions, today]);

  if (isLoading) {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-github-muted">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-black uppercase tracking-widest text-xs">Sincronizando seus dados...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <HealthThermometer />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-4 border-b-2 border-github-success">
          <div className="p-3 bg-github-success/10 text-github-success rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] text-github-muted font-black uppercase tracking-wider">Entradas (Mês)</p>
            <p className="text-xl font-bold">{formatCurrency(stats.income || 0)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-b-2 border-github-danger">
          <div className="p-3 bg-github-danger/10 text-github-danger rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] text-github-muted font-black uppercase tracking-wider">Saídas (Mês)</p>
            <p className="text-xl font-bold">{formatCurrency(stats.expenses || 0)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-b-2 border-github-primary">
          <div className="p-3 bg-github-primary/10 text-github-primary rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] text-github-muted font-black uppercase tracking-wider">Total em Contas</p>
            <p className="text-xl font-bold">{formatCurrency(currentTotalBalance || 0)}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-b-2 border-github-purple">
          <div className="p-3 bg-github-purple/10 text-github-purple rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-[10px] text-github-muted font-black uppercase tracking-wider">Faturas do Mês</p>
            <p className="text-xl font-bold">{formatCurrency(stats.creditCardBill || 0)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col h-[500px] overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-github-muted">Exploração Patrimonial 3D</h3>
              <p className="text-[10px] text-github-muted italic">Arraste para girar • Clique para destacar</p>
            </div>
          </div>
          
          <div className="flex-1 w-full relative flex items-center justify-center">
            {categoryData.length > 0 ? (
                threeLoaded ? (
                  <Canvas shadows dpr={[1, 2]}>
                    <Suspense fallback={null}>
                      <Pie3DScene data={categoryData} />
                    </Suspense>
                  </Canvas>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={32} className="text-github-primary animate-spin" />
                    <span className="text-xs font-black uppercase text-github-muted">Iniciando Gráficos 3D...</span>
                  </div>
                )
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-github-muted opacity-30 animate-pulse">
                    <PieChart size={64} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">Aguardando lançamentos no mês</p>
                    <p className="text-[10px] mt-2">As despesas do mês aparecerão aqui em 3D</p>
                </div>
            )}
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-github-muted mb-6">Investimentos Ativos</h3>
            <div className="space-y-6">
                <div className="p-5 bg-github-bg rounded-2xl border border-github-border shadow-inner group">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-black uppercase text-github-muted">Total Acumulado</p>
                    </div>
                    <p className="text-3xl font-black text-github-success tracking-tighter">{formatCurrency(stats.investments || 0)}</p>
                    <div className="w-full bg-github-surface h-2.5 rounded-full mt-4 overflow-hidden border border-github-border">
                        <div className="bg-github-success h-full transition-all duration-1000" style={{ width: (stats.investments || 0) > 0 ? '100%' : '0%' }}></div>
                    </div>
                </div>
                
                <div className="p-4 rounded-xl border border-github-border/40 bg-github-surface/30">
                    <p className="text-[11px] text-github-muted italic leading-relaxed">
                        {(stats.investments || 0) > 0 
                            ? "Seus aportes estão trabalhando por você. Continue diversificando!"
                            : "Comece a investir hoje mesmo para construir seu futuro."}
                    </p>
                </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-github-border text-center">
            <p className="text-[10px] font-black uppercase text-github-muted tracking-widest mb-2">Monitoramento</p>
            <div className="flex items-center justify-center gap-2 text-github-muted">
                <Clock size={16} />
                <span className="font-bold text-xs uppercase tracking-tighter">Dados atualizados em tempo real</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
