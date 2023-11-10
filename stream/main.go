package main

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/deepch/vdk/av"
	"github.com/deepch/vdk/format/rtspv2"
	"github.com/deepch/vdk/format/ts"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var (
	Success                         = "success"
	ErrorStreamNotFound             = errors.New("stream not found")
	ErrorStreamAlreadyExists        = errors.New("stream already exists")
	ErrorStreamChannelAlreadyExists = errors.New("stream channel already exists")
	ErrorStreamNotHLSSegments       = errors.New("stream hls not ts seq found")
	ErrorStreamNoVideo              = errors.New("stream no video")
	ErrorStreamNoClients            = errors.New("stream no clients")
	ErrorStreamRestart              = errors.New("stream restart")
	ErrorStreamStopCoreSignal       = errors.New("stream stop core signal")
	ErrorStreamStopRTSPSignal       = errors.New("stream stop rtsp signal")
	ErrorStreamChannelNotFound      = errors.New("stream channel not found")
	ErrorStreamChannelCodecNotFound = errors.New("stream channel codec not ready, possible stream offline")
	ErrorStreamsLen0                = errors.New("streams len zero")
)

// Config global
var Config = loadConfig()

// ConfigST struct
type ConfigST struct {
	mutex   sync.RWMutex
	Server  ServerST            `json:"server"`
	Streams map[string]StreamST `json:"streams"`
}

// ServerST struct
type ServerST struct {
	HTTPPort string `json:"http_port"`
}

// StreamST struct
type StreamST struct {
	URL              string          `json:"url"`
	Status           bool            `json:"status"`
	OnDemand         bool            `json:"on_demand"`
	RunLock          bool            `json:"-"`
	hlsSegmentNumber int             `json:"-"`
	hlsSegmentBuffer map[int]Segment `json:"-"`
	Codecs           []av.CodecData
	Cl               map[string]viewer
}

// Segment HLS cache section
type Segment struct {
	dur  time.Duration
	data []*av.Packet
}

type viewer struct {
	c chan av.Packet
}

func (element *ConfigST) RunIFNotRun(uuid string) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	if tmp, ok := element.Streams[uuid]; ok {
		if tmp.OnDemand && !tmp.RunLock {
			tmp.RunLock = true
			element.Streams[uuid] = tmp
			go RTSPWorkerLoop(uuid, tmp.URL, tmp.OnDemand)
		}
	}
}

func (element *ConfigST) RunUnlock(uuid string) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	if tmp, ok := element.Streams[uuid]; ok {
		if tmp.OnDemand && tmp.RunLock {
			tmp.RunLock = false
			element.Streams[uuid] = tmp
		}
	}
}

func (element *ConfigST) HasViewer(uuid string) bool {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	if tmp, ok := element.Streams[uuid]; ok && len(tmp.Cl) > 0 {
		return true
	}
	return false
}

func loadConfig() *ConfigST {
	var tmp ConfigST
	data, err := ioutil.ReadFile("./config/stream_config.json")
	if err != nil {
		log.Fatalln(err)
	}
	err = json.Unmarshal(data, &tmp)
	if err != nil {
		log.Fatalln(err)
	}
	for i, v := range tmp.Streams {
		v.Cl = make(map[string]viewer)
		v.hlsSegmentBuffer = make(map[int]Segment)
		tmp.Streams[i] = v
	}
	return &tmp
}

func (element *ConfigST) cast(uuid string, pck av.Packet) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	for _, v := range element.Streams[uuid].Cl {
		if len(v.c) < cap(v.c) {
			v.c <- pck
		}
	}
}

func (element *ConfigST) ext(suuid string) bool {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	_, ok := element.Streams[suuid]
	return ok
}

func (element *ConfigST) coAd(suuid string, codecs []av.CodecData) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	t := element.Streams[suuid]
	t.Codecs = codecs
	element.Streams[suuid] = t
}

func (element *ConfigST) coGe(suuid string) []av.CodecData {
	for i := 0; i < 100; i++ {
		element.mutex.RLock()
		tmp, ok := element.Streams[suuid]
		element.mutex.RUnlock()
		if !ok {
			return nil
		}
		if tmp.Codecs != nil {
			return tmp.Codecs
		}
		time.Sleep(50 * time.Millisecond)
	}
	return nil
}

func (element *ConfigST) clAd(suuid string) (string, chan av.Packet) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	cuuid := pseudoUUID()
	ch := make(chan av.Packet, 100)
	element.Streams[suuid].Cl[cuuid] = viewer{c: ch}
	return cuuid, ch
}

func (element *ConfigST) list() (string, []string) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	var res []string
	var fist string
	for k := range element.Streams {
		if fist == "" {
			fist = k
		}
		res = append(res, k)
	}
	return fist, res
}
func (element *ConfigST) clDe(suuid, cuuid string) {
	element.mutex.Lock()
	defer element.mutex.Unlock()
	delete(element.Streams[suuid].Cl, cuuid)
}

func pseudoUUID() (uuid string) {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	uuid = fmt.Sprintf("%X-%X-%X-%X-%X", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
	return
}

// StreamHLSAdd add hls seq to buffer
func (obj *ConfigST) StreamHLSAdd(uuid string, val []*av.Packet, dur time.Duration) {
	obj.mutex.Lock()
	defer obj.mutex.Unlock()
	if tmp, ok := obj.Streams[uuid]; ok {
		tmp.hlsSegmentNumber++
		tmp.hlsSegmentBuffer[tmp.hlsSegmentNumber] = Segment{data: val, dur: dur}
		if len(tmp.hlsSegmentBuffer) >= 6 {
			delete(tmp.hlsSegmentBuffer, tmp.hlsSegmentNumber-6-1)
		}
		obj.Streams[uuid] = tmp
	}
}

// StreamHLSm3u8 get hls m3u8 list
func (obj *ConfigST) StreamHLSm3u8(uuid string) (string, int, error) {
	obj.mutex.RLock()
	defer obj.mutex.RUnlock()
	if tmp, ok := obj.Streams[uuid]; ok {
		var out string
		//TODO fix  it
		out += "#EXTM3U\r\n#EXT-X-TARGETDURATION:4\r\n#EXT-X-VERSION:4\r\n#EXT-X-MEDIA-SEQUENCE:" + strconv.Itoa(tmp.hlsSegmentNumber) + "\r\n"
		var keys []int
		for k := range tmp.hlsSegmentBuffer {
			keys = append(keys, k)
		}
		sort.Ints(keys)
		var count int
		for _, i := range keys {
			count++
			out += "#EXTINF:" + strconv.FormatFloat(tmp.hlsSegmentBuffer[i].dur.Seconds(), 'f', 1, 64) + ",\r\nsegment/" + strconv.Itoa(i) + "/file.ts\r\n"

		}
		return out, count, nil
	}
	return "", 0, ErrorStreamNotFound
}

// StreamHLSTS send hls segment buffer to clients
func (obj *ConfigST) StreamHLSTS(uuid string, seq int) ([]*av.Packet, error) {
	obj.mutex.RLock()
	defer obj.mutex.RUnlock()
	if tmp, ok := obj.Streams[uuid]; ok {
		if buf, ok := tmp.hlsSegmentBuffer[seq]; ok {
			return buf.data, nil
		}
	}
	return nil, ErrorStreamNotFound
}

// StreamHLSFlush delete hls cache
func (obj *ConfigST) StreamHLSFlush(uuid string) {
	obj.mutex.Lock()
	defer obj.mutex.Unlock()
	if tmp, ok := obj.Streams[uuid]; ok {
		tmp.hlsSegmentBuffer = make(map[int]Segment)
		tmp.hlsSegmentNumber = 0
		obj.Streams[uuid] = tmp
	}
}

// stringToInt convert string to int if err to zero
func stringToInt(val string) int {
	i, err := strconv.Atoi(val)
	if err != nil {
		return 0
	}
	return i
}

var (
	ErrorStreamExitNoVideoOnStream = errors.New("stream Exit No Video On Stream")
	ErrorStreamExitRtspDisconnect  = errors.New("stream Exit Rtsp Disconnect")
	ErrorStreamExitNoViewer        = errors.New("stream Exit On Demand No Viewer")
)

func serveStreams() {
	for k, v := range Config.Streams {
		if v.OnDemand {
			log.Println("OnDemand not supported")
			v.OnDemand = false
		}
		if !v.OnDemand {
			go RTSPWorkerLoop(k, v.URL, v.OnDemand)
		}
	}
}

func RTSPWorkerLoop(name, url string, OnDemand bool) {
	defer Config.RunUnlock(name)
	for {
		log.Println(name, "Stream Try Connect")
		err := RTSPWorker(name, url, OnDemand)
		if err != nil {
			log.Println(err)
		}
		if OnDemand && !Config.HasViewer(name) {
			log.Println(name, ErrorStreamExitNoViewer)
			return
		}
		time.Sleep(1 * time.Second)
	}
}

func RTSPWorker(name, url string, OnDemand bool) error {
	keyTest := time.NewTimer(20 * time.Second)
	clientTest := time.NewTimer(20 * time.Second)
	var preKeyTS = time.Duration(0)
	var Seq []*av.Packet
	RTSPClient, err := rtspv2.Dial(rtspv2.RTSPClientOptions{URL: url, DisableAudio: false, DialTimeout: 3 * time.Second, ReadWriteTimeout: 3 * time.Second, Debug: false})
	if err != nil {
		return err
	}
	defer RTSPClient.Close()
	if RTSPClient.CodecData != nil {
		Config.coAd(name, RTSPClient.CodecData)
	}
	var AudioOnly bool
	if len(RTSPClient.CodecData) == 1 && RTSPClient.CodecData[0].Type().IsAudio() {
		AudioOnly = true
	}
	for {
		select {
		case <-clientTest.C:
			if OnDemand && !Config.HasViewer(name) {
				return ErrorStreamExitNoViewer
			}
		case <-keyTest.C:
			return ErrorStreamExitNoVideoOnStream
		case signals := <-RTSPClient.Signals:
			switch signals {
			case rtspv2.SignalCodecUpdate:
				Config.coAd(name, RTSPClient.CodecData)
			case rtspv2.SignalStreamRTPStop:
				return ErrorStreamExitRtspDisconnect
			}
		case packetAV := <-RTSPClient.OutgoingPacketQueue:
			if AudioOnly || packetAV.IsKeyFrame {
				keyTest.Reset(20 * time.Second)
				if preKeyTS > 0 {
					Config.StreamHLSAdd(name, Seq, packetAV.Time-preKeyTS)
					Seq = []*av.Packet{}
				}
				preKeyTS = packetAV.Time
			}
			Seq = append(Seq, packetAV)
		}
	}
}

func serveHTTP() {
	router := gin.Default()
	gin.SetMode(gin.DebugMode)
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"*"},
		AllowHeaders: []string{"*"},
	}))
	router.LoadHTMLGlob("web/templates/*")
	router.GET("/", func(c *gin.Context) {
		fi, all := Config.list()
		sort.Strings(all)
		c.HTML(http.StatusOK, "index.tmpl", gin.H{
			"port":     Config.Server.HTTPPort,
			"suuid":    fi,
			"suuidMap": all,
			"version":  time.Now().String(),
		})
	})
	router.GET("/player/:suuid", func(c *gin.Context) {
		_, all := Config.list()
		sort.Strings(all)
		c.HTML(http.StatusOK, "index.tmpl", gin.H{
			"port":     Config.Server.HTTPPort,
			"suuid":    c.Param("suuid"),
			"suuidMap": all,
			"version":  time.Now().String(),
		})
	})
	router.GET("/play/hls/:suuid/index.m3u8", PlayHLS)
	router.GET("/play/hls/:suuid/segment/:seq/file.ts", PlayHLSTS)
	router.StaticFS("/static", http.Dir("web/static"))
	err := router.Run(Config.Server.HTTPPort)
	if err != nil {
		log.Fatalln(err)
	}
}

func PlayHLS(c *gin.Context) {
	suuid := c.Param("suuid")
	if !Config.ext(suuid) {
		return
	}
	Config.RunIFNotRun(suuid)
	for i := 0; i < 40; i++ {
		index, seq, err := Config.StreamHLSm3u8(suuid)
		if err != nil {
			log.Println(err)
			return
		}
		if seq >= 6 {
			_, err := c.Writer.Write([]byte(index))
			if err != nil {
				log.Println(err)
				return
			}
			return
		}
		log.Println("Play list not ready wait or try update page")
		time.Sleep(1 * time.Second)
	}
}

// PlayHLSTS send client ts segment
func PlayHLSTS(c *gin.Context) {
	suuid := c.Param("suuid")
	if !Config.ext(suuid) {
		return
	}
	codecs := Config.coGe(c.Param("suuid"))
	if codecs == nil {
		return
	}
	outfile := bytes.NewBuffer([]byte{})
	Muxer := ts.NewMuxer(outfile)
	err := Muxer.WriteHeader(codecs)
	if err != nil {
		log.Println(err)
		return
	}
	Muxer.PaddingToMakeCounterCont = true
	seqData, err := Config.StreamHLSTS(c.Param("suuid"), stringToInt(c.Param("seq")))
	if err != nil {
		log.Println(err)
		return
	}
	if len(seqData) == 0 {
		log.Println(err)
		return
	}
	for _, v := range seqData {
		v.CompositionTime = 1
		err = Muxer.WritePacket(*v)
		if err != nil {
			log.Println(err)
			return
		}
	}
	err = Muxer.WriteTrailer()
	if err != nil {
		log.Println(err)
		return
	}
	_, err = c.Writer.Write(outfile.Bytes())
	if err != nil {
		log.Println(err)
		return
	}
}

func main() {
	go serveHTTP()
	go serveStreams()
	sigs := make(chan os.Signal, 1)
	done := make(chan bool, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		log.Println(sig)
		done <- true
	}()
	log.Println("Server Start Awaiting Signal")
	<-done
	log.Println("Exiting")
}
