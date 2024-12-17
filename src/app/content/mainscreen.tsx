'use client'
import { AddPoints, EditPoints } from "@/server-actions/points";
import { PointsType } from "../interfaces";
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faGear } from '@fortawesome/free-solid-svg-icons';

interface PointsResponse {
    success: boolean;
    message?: string;
    error?: string;
}

function MainScreen({ pointObject }: { pointObject?: PointsType }) {
    console.log("Initial pointObject:", pointObject);

    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [points, setPoints] = useState(pointObject?.points ?? 0);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pin, setPin] = useState('');
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [pointsToAdd, setPointsToAdd] = useState(0);
    const [isConsumingPoints, setIsConsumingPoints] = useState(false);
    const [consumedSeconds, setConsumedSeconds] = useState(0);

    console.log("point:", pointObject)
  


    useEffect(() => {
        if (typeof pointObject?.points === 'number') {
            setPoints(pointObject.points);
        }
    }, [pointObject]);

    const updatePoints = async (newPoints: number) => {
        try {
            let response: PointsResponse = { success: false };
            const roundedPoints = Math.floor(newPoints);

            if (!pointObject) {
                response = await AddPoints(roundedPoints);
            } else if (pointObject) {
                response = await EditPoints({ pointsId: pointObject?._id, payload: roundedPoints });
            }

            if (response.success) {
                console.log(response.message);
            }
            if (!response.success) {
                console.log(response.error);
            }

        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            } else {
                console.log('An unknown error occurred');
            }
        }
    };

    const startTimer = () => {
        if (!isRunning) {
            if (isConsumingPoints) {
                // Start countdown from points * 60 seconds
                setTime(points * 60);
                const id = setInterval(() => {
                    setTime((prevTime) => {
                        if (prevTime <= 0) {
                            clearInterval(id);
                            setIsRunning(false);
                            setIntervalId(null);
                            return 0;
                        }
                        return prevTime - 1;
                    });
                    setConsumedSeconds(prev => prev + 1);
                }, 1000);
                setIntervalId(id);
            } else {
                const id = setInterval(() => {
                    setTime(prevTime => {
                        const newTime = prevTime + 1;
                        if (newTime % 60 === 0) {
                            setPoints(prevPoints => {
                                const newPoints = prevPoints + 1;
                                updatePoints(newPoints);
                                return newPoints;
                            });
                        }
                        return newTime;
                    });
                }, 1000);
                setIntervalId(id);
            }
            setIsRunning(true);
        }
    };

    const pauseTimer = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
            setIsRunning(false);
        }
    };

    const stopTimer = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
        setIsRunning(false);

        if (!isConsumingPoints) {
            // Point earning mode
            const newPoints = Math.floor(time / 60);
            const totalPoints = points + newPoints;
            updatePoints(totalPoints);
        } else {
            // Point consuming mode
            const remainingPoints = Math.max(0, points - (consumedSeconds / 60));
            updatePoints(remainingPoints);
        }
        setTime(0);
        setConsumedSeconds(0);
    };

    const toggleMode = () => {
        if (!isRunning) {
            setIsConsumingPoints(!isConsumingPoints);
            setTime(0);
            setConsumedSeconds(0);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(Math.abs(Math.floor(seconds)) / 60);
        const remainingSeconds = Math.abs(Math.floor(seconds)) % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Calculate how many full and partial stars to show
    const calculateStars = () => {
        if (!isConsumingPoints || !isRunning) {
            return { fullStars: Math.max(0, Math.floor(points)), partialStar: 0 };
        }

        const consumedPoints = consumedSeconds / 60;
        const remainingPoints = Math.max(0, points - consumedPoints);
        const fullStars = Math.floor(remainingPoints);
        const partialStar = remainingPoints % 1;

        return { fullStars, partialStar };
    };

    const { fullStars, partialStar } = calculateStars();

    const handlePointsModification = async (amount: number) => {
        const newTotal = points + amount;
        if (newTotal >= 0) {
            await updatePoints(newTotal);
        }
    };

    const handlePinSubmit = () => {
        if (pin === '2455') {
            setIsPinVerified(true);
            setPin('');
        } else {
            alert('Helytelen PIN kód!');
            setPin('');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsPinVerified(false);
        setPin('');
        setPointsToAdd(0);
    };

    useEffect(() => {
        // Itt használhatók a window, document stb. API-k
    }, [])

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 p-4" >
            <main className="flex-1 flex flex-col items-center" >
                <div className="bg-white p-8 rounded-lg shadow-lg text-center relative w-full max-w-md" >
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                    >
                        <FontAwesomeIcon icon={faGear} className="text-xl" />
                    </button>

                    < div className="text-6xl font-bold text-black mb-8" > {formatTime(time)} </div>

                    < div className="space-x-4 mb-4" >
                        <button
                            onClick={isRunning ? pauseTimer : startTimer}
                            className={`px-6 py-2 rounded-full text-white font-semibold ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                                }`
                            }
                        >
                            {isRunning ? 'Pause' : 'Start'}
                        </button>

                        < button
                            onClick={stopTimer}
                            className="px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                        >
                            Stop
                        </button>
                    </div>

                    < button
                        onClick={toggleMode}
                        disabled={isRunning}
                        className={`px-4 py-2 rounded-full font-semibold ${isConsumingPoints
                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isConsumingPoints ? 'Pontgyűjtő mód' : 'Pontfelhasználó mód'}
                    </button>

                    < div className="mt-8 text-xl font-semibold text-black" >
                        Összes csillag: {points.toFixed(0)}
                    </div>
                </div>

                < div className="w-full max-w-2xl mt-8 bg-white rounded-lg shadow-lg p-4" >
                    <div className="grid grid-cols-8 gap-1 justify-items-center">
                        {Array.from({ length: 24 }).map((_, index) => {
                            const row = Math.floor(index / 8);
                            const position = row * 8 + (index % 8);
                            
                            if (position < fullStars) {
                                return <FontAwesomeIcon key={index} icon={faStar} className="text-amber-400 text-lg" />;
                            } else if (position === fullStars && partialStar > 0) {
                                return (
                                    <div key={index} className="relative inline-flex">
                                        <FontAwesomeIcon icon={faStar} className="text-gray-400 text-lg" />
                                        <FontAwesomeIcon
                                            icon={faStar}
                                            className="text-amber-400 text-lg absolute inset-0"
                                            style={{ opacity: partialStar }}
                                        />
                                    </div>
                                );
                            } else if (position < Math.ceil(points)) {
                                return <FontAwesomeIcon key={index} icon={faStar} className="text-gray-400 text-lg" />;
                            }
                            return null;
                        })}
                    </div>
                </div>
            </main>

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" >
                        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full" >
                            {!isPinVerified ? (
                                <div>
                                    <h2 className="text-2xl font-bold mb-4" > PIN kód megadása </h2>
                                    < input
                                        type="password"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)
                                        }
                                        className="w-full p-2 border rounded mb-4"
                                        placeholder="Adja meg a PIN kódot"
                                    />
                                    <div className="flex justify-end space-x-2" >
                                        <button
                                            onClick={closeModal}
                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            Mégse
                                        </button>
                                        < button
                                            onClick={handlePinSubmit}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Belépés
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-2xl font-bold mb-4" > Pontok módosítása </h2>
                                    < div className="flex items-center space-x-4 mb-4" >
                                        <button
                                            onClick={() => handlePointsModification(-1)}
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            -1
                                        </button>
                                        < span className="text-xl font-bold" > {points} </span>
                                        < button
                                            onClick={() => handlePointsModification(1)}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            +1
                                        </button>
                                    </div>
                                    < div className="flex items-center space-x-2 mb-4" >
                                        <input
                                            type="number"
                                            value={pointsToAdd}
                                            onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                                            className="w-24 p-2 border rounded"
                                            min="0"
                                        />
                                        <button
                                            onClick={() => handlePointsModification(pointsToAdd)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            Hozzáad
                                        </button>
                                    </div>
                                    < button
                                        onClick={closeModal}
                                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        Bezárás
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
        </div>
    )
}


export default MainScreen;
