package config

import (
	"net"
)

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			ip := ipnet.IP.To4()
			if ip != nil && ip.String()[:4] == "192." {
				return ip.String()
			}
		}
	}
	return "localhost"
}

var LocalIP = getLocalIP()
