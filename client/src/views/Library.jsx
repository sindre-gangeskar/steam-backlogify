import React, { useState, useEffect, useRef } from 'react';
import { BiCheckCircle } from "react-icons/bi";
import { RxCheckCircled, RxCross2 } from 'react-icons/rx';
import { FaCircleArrowRight, FaCircleArrowLeft } from "react-icons/fa6";
/* Components */
import ImageWithFallback from '../partials/ImageWithFallback';
import Background from '../partials/Background';
import Search from '../partials/Search';
import Loading from './Loading';
import CardWrapper from '../partials/CardWrapper';
import HeroPoster from '../partials/HeroPoster';
import Modal from '../partials/Modal';
import AchievementsProgress from '../partials/AchievementsProgress';
import AchievementsList from '../partials/AchievementsList';
import GamesWrapper from '../partials/GamesWrapper';
import useGlobalState from '../js/globalStateStore';
/* Classes */
import Timer from '../js/Timer';

/* CSS */
import '../css/Library.css';
import '../css/index.css';
import Utils from '../js/utils';
import AchievementCard from '../partials/AchievementCard';

function Library() {
    const timer = new Timer();
    const utils = new Utils();
    const steamid = localStorage.getItem('steamid');
    const baseURL = import.meta.env.VITE_SERVER_BASEURL;

    const [ authenticated ] = useGlobalState(state => [ state.authenticated ]);
    const [ order ] = useGlobalState(state => [ state.order ]);
    const [ games, setGames ] = useGlobalState(state => [ state.games, state.setGames ]);
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(null);
    const [ filter, setFilter ] = useState('');
    const [ showAppID, setShowAppID ] = useGlobalState(state => [ state.showAppID, state.setShowAppID ]);
    const [ showGameTitle, setShowGameTitle ] = useGlobalState(state => [ state.showGameTitle, state.setShowGameTitle ]);
    const [ gameCardScale, setGameCardScale ] = useState(parseInt(localStorage.getItem('cardScale') || 1));

    const [ page, setPage ] = useState(1);
    const [ gamesPerPage, setGamesPerPage ] = useState(100);

    const [ achievements, setAchievements ] = useState([]);
    const [ achieved, setAchieved ] = useState([]);
    const [ achievementIcons, setAchievementIcons ] = useState([]);
    const [ achievementIndex, setAchievementIndex ] = useState(0);
    const [ achievementProgress, setAchievementProgress ] = useState(0);
    const [ achievementsVisible, setAchievementsVisible ] = useState(false);
    const [ achievementTransition, setAchievementTransition ] = useState(false);
    const [ achievementDescription, setAchievementDescription ] = useState('');
    const [ achievementsFetched, setAchievementsFetched ] = useState(false);

    const [ modalOpen, setModalOpen ] = useState(false);
    const [ modalTitle, setModalTitle ] = useState(null);
    const [ modalAppID, setModalAppID ] = useState(null);
    const [ modalBody, setModalBody ] = useState(null);
    const [ modalFooter, setModalFooter ] = useState(null);
    const [ modalVisible, setModalVisible ] = useState(false);
    const [ modalCurrentApp, setModalCurrentApp ] = useState(null);
    const [ loadingVisible, setLoadingVisible ] = useState(true);

    const gamesWrapperRef = useRef(null);
    const modalWrapperRef = useRef(null);
    const gamesFormRef = useRef(null);
    const progressBarRef = useRef(null);

    const filtered = games ? games?.data.appids.filter(x => x.name.toLowerCase().includes(filter.toLowerCase())) : [];

    const totalPages = Math.ceil(filtered.length / gamesPerPage);

    useEffect(() => {
        document.title = 'Library';
    }, [])

    /* Games */
    useEffect(() => {
        let finished = false;

        const getGames = async () => {
            setLoading(true);
            setLoadingVisible(true);

            try {
                const response = await fetch(`${baseURL}/library/${steamid}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (response.ok && !finished) {
                    const data = await response.json();

                    if (data && data.data.appids.length > 0) {
                        setGames(data);
                    }

                    else {
                        setError(data.data.message);
                    }
                }
            } catch (error) {
                setError(error.message);
            } finally {
                await timer.delay(1.5)
                setLoadingVisible(false)
            }
        };
        if (authenticated)
            getGames();
        return (() => { finished = true; setLoading(false) });
    }, [ steamid ]);

    /* Set achievement progress on achievements change */
    useEffect(() => {
        if (modalCurrentApp && achievements.length > 0) {
            const progress = Math.round((achieved.length / achievements.length) * 100);
            setAchievementProgress(progress);
            setAchievementIndex(0);
        }
    }, [ modalOpen, achievements ])

    /* Initiate modal with data */
    useEffect(() => {
        const initiateModal = async () => {
            if (modalCurrentApp) {
                setModalAppID(modalCurrentApp.appid);
                setModalTitle(<>
                    <span className="modal-top">
                        <pre className="modal-appid">AppID: {modalCurrentApp.appid}</pre>
                        <div className="modal-title">{modalCurrentApp.name}</div>
                        <button onClick={closeModal} className='modal-close-btn'><RxCross2></RxCross2></button>
                    </span>
                </>);
                setModalBody(<>
                    <div className="modal-body" key={modalCurrentApp.appid}>
                        <div className="playtime-wrapper">
                            <p>Total Playtime in hours:</p>
                            <p>{Math.round(modalCurrentApp.playtime_forever / 60)}</p>
                        </div>

                        <div className="achievements-wrapper" key={modalCurrentApp.appid}>
                            <AchievementsList icons={achievementIcons} setAchievementIndex={(index) => { setAchievementIndex(index) }} achievements={achievements} achieved={achieved} visible={achievementsVisible} achievedIcon={<BiCheckCircle className='achievement-status-icon positive' size={25} />} notAchievedIcon={<RxCross2 className='achievement-status-icon negative' size={25} />} />
                            <AchievementCard icons={achievementIcons} achievementIndex={achievementIndex} achievements={achievements} />
                        </div>
                        <AchievementsProgress progress={achievementProgress} achievements={achievements} achieved={achieved} visible={achievementsVisible} ref={progressBarRef} play={achievementTransition} />

                        <div className="hero-poster-wrapper">
                            <HeroPoster app={modalCurrentApp} className="hero-poster" />
                        </div>

                        <div className="library-hero-wrapper" >
                            <ImageWithFallback root={modalWrapperRef.current} key={modalCurrentApp.appid}
                                src={`https://steamcdn-a.akamaihd.net/steam/apps/${modalCurrentApp.appid}/library_hero.jpg`}
                                fallbackSrc={`https://steamcdn-a.akamaihd.net/steam/apps/${modalCurrentApp.appid}/header.jpg`}
                                className='library-hero'
                                alt="library_hero.jpg"
                            />
                        </div>
                    </div>
                </>)

                var buttonText = `Add ${modalCurrentApp.name} to the backlog`;
                if (modalCurrentApp.backlogged)
                    buttonText = `${modalCurrentApp.name} is added to the backlog`
                setModalFooter(
                    <>
                        <div className="modal-footer">
                            <span>
                                <form id='app-form' ref={gamesFormRef} onSubmit={handleSubmit}>
                                    <input type="hidden" name='appid' value={modalCurrentApp.appid} />
                                    <input type="hidden" name='name' value={modalCurrentApp.name} />
                                    <input type="hidden" name='playtime_forever' value={modalCurrentApp.playtime_forever} />
                                    <input type="hidden" name='steamid' value={localStorage.getItem('steamid')} />
                                    <button type='submit' className={`modal-footer-btn  ${modalCurrentApp.backlogged ? 'backlogged' : 'add'}`}>{buttonText}{modalCurrentApp.backlogged ? <BiCheckCircle className='checked' /> : ''}</button>
                                </form>
                            </span>
                        </div>
                    </>
                );
            }
        }
        initiateModal(modalCurrentApp);
    }, [ modalCurrentApp, achievementTransition, achievementsVisible, achievementProgress, modalCurrentApp?.backlogged, achievementIndex ])

    /* Save card scale value to localStorage on change */
    useEffect(() => {
        localStorage.setItem('cardScale', +gameCardScale);
    }, [ gameCardScale ])

    useEffect(() => {
        setAchievementDescription(achievements[ achievementIndex ]?.description)
    }, [ achievementIndex ])

    /* Set progress bar visibility */
    useEffect(() => {
        const callAchievements = async () => {
            if (modalCurrentApp && modalOpen) {
                await timer.delay(0.25);
                setAchievementsVisible(true);
            }
        }
        callAchievements();
    }, [ modalOpen, modalCurrentApp ])

    /* Initialize the achievement bar transition  */
    useEffect(() => {
        if (achievementsVisible) {
            timer.delay(0.2)
            setAchievementTransition(true);
        }
        else {
            setAchievementProgress(0);
            setAchievementTransition(false);
        }

    }, [ achievementsVisible ])

    function paginate(itemsPerPage, currentPage, array) {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const paginatedItems = array.slice(startIndex, endIndex);

        if (games)
            utils.sortAlphabetically(order, games.data.appids)

        return paginatedItems.map(app => (
            <CardWrapper key={app.appid} app={app} backlogged={app.backlogged ? true : false} showAppID={showAppID} showGameTitle={showGameTitle} scale={gameCardScale} onClick={(async () => { await initializeModal(app); })} />
        ))
    }
    function handleFilter(searchValue) {
        setFilter(searchValue);
        setPage(1);
    }
    async function awaitModalLoading(app) {
        return new Promise(async (resolve, reject) => {
            try {
                await fetchAchievements(app);
                resolve();

            } catch (error) {
                reject(error);
            }
        })
    }
    async function initializeModal(app) {
        await awaitModalClosed();
        await awaitModalLoading(app);
        setModalCurrentApp(app);

        setModalOpen(true);
        await timer.delay(0.1);
        setModalVisible(true)
    }
    async function closeModal() {
        setModalVisible(false);
        setAchievementsVisible(false)
        await timer.delay(0.1);
        setModalOpen(false);
    }
    async function awaitModalClosed() {
        return new Promise(resolve => {
            resolve(modalOpen === false);
        })
    }
    async function handleSubmit(event) {
        event.preventDefault();
        const form = new FormData(gamesFormRef.current);
        const name = form.get('name');
        const appid = form.get('appid');
        const playtime_forever = form.get('playtime_forever');
        const steamid = form.get('steamid');

        try {
            const response = await fetch(`${baseURL}/backlog`, {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ appid, name, playtime_forever, steamid, backlogged: true })
            });

            if (response.ok) {
                setModalCurrentApp({ ...modalCurrentApp, backlogged: true });
                modalCurrentApp.backlogged = true;
            }
        } catch (error) {
            console.error(error);
        }
    }
    async function fetchAchievements(app) {
        setAchievementsFetched(false);
        try {
            const response = await fetch(`${baseURL}/achievements/${steamid}/${app.appid}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                const data = await response.json();
                const achievements = data.data?.achievements;
                const achieved = data.data?.achieved;
                const icons = data.data?.icons;

                achievements?.length > 0 ? setAchievements(achievements) : setAchievements([]);
                achieved?.length > 0 ? setAchieved(achieved) : setAchieved([]);
                icons?.length > 0 ? setAchievementIcons(icons) : setAchievementIcons([]);
            }
            else {
                setAchieved([]);
                setAchievements([]);
            }
        } catch (error) {
            console.error(error);
        }
        finally {
            setAchievementsFetched(true);
        }
    }

    if (error) {
        return (
            <>
                <div className="games-wrapper">
                    <h3>{error}</h3>
                </div>
                <Background />
            </>
        );
    }
    return (
        <>
            <Loading key={loading} className={`${loadingVisible ? 'visible' : ''}`} />
            <Search
                onSubmit={handleFilter}
                setAppIDVisibility={setShowAppID}
                setGameTitleVisibility={setShowGameTitle}
                increaseScale={(() => { utils.increaseScale(setGameCardScale, gameCardScale) })}
                decreaseScale={(() => { utils.decreaseScale(setGameCardScale, gameCardScale) })}
                scaleValue={gameCardScale}
                set25PerPage={() => { setGamesPerPage(25); utils.scrollToTop(gamesWrapperRef) }}
                set50PerPage={() => { setGamesPerPage(50); utils.scrollToTop(gamesWrapperRef) }}
                set100PerPage={() => { setGamesPerPage(100); utils.scrollToTop(gamesWrapperRef) }}
                seeAllGames={() => { setGamesPerPage(filtered.length); utils.scrollToTop(gamesWrapperRef); utils.goToFirstPage(setPage, gamesWrapperRef) }} />
            <GamesWrapper ref={gamesWrapperRef} content={paginate(gamesPerPage, page, filtered)} order={order} />
            <div className="panel">
                {page !== 1 ?
                    <button className='pagination-first-button' onClick={() => { utils.goToFirstPage(setPage, gamesWrapperRef) }}>1</button>
                    : null}

                <span className="pagination-controls">
                    {page !== 1 && totalPages > 1 ?
                        <button className='pagination-button' onClick={() => { utils.previousPage(page, setPage, gamesWrapperRef) }}><FaCircleArrowLeft /></button>
                        : <button className='pagination-button disabled hidden'><FaCircleArrowLeft /></button>}
                    <p>{totalPages > 1 ? page : ''}</p>
                    {page !== totalPages && totalPages > 1 ?
                        <button className='pagination-button' onClick={() => { utils.nextPage(page, totalPages, setPage, gamesWrapperRef) }}><FaCircleArrowRight /></button>
                        : <button className='pagination-button disabled hidden'><FaCircleArrowRight /></button>}
                </span>

                {page !== totalPages && totalPages > 1 ?
                    <button className='pagination-last-button' onClick={() => { utils.goToLastPage(setPage, totalPages, gamesWrapperRef) }}>{totalPages}</button>
                    : null}
            </div>
            <Background />
            <Modal
                className={`modal-wrapper ${modalVisible ? 'open' : 'close'}`}
                isOpen={modalOpen}
                title={modalTitle}
                body={modalBody}
                footer={modalFooter}
                appid={'AppID:' + modalAppID}
                onClose={(() => { closeModal() })}
                backdrop="true"
            />
        </>
    );
}

export default Library;
