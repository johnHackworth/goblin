# Installing on your own bare metal server (Hetzner, Scaleway, OVH ...)

This guide is for people who are willing to spend $50 a month or so for dedicated hardware.

Pros:
* you can run anything else on it (minecraft server, etc)
* it's powerful enough for possibly hundreds of active users (possibly also hundreds of thousands of registered, inactive users, but that's a speculation until I do benchmarks)
* no dependency on shady, unpredictable cloud billing - the monthly cost will never go up with higher usage
* possibly fun if you're a developer and want to host other projects

Cons:
* not the cheapest
* definitely not for people who can't afford the time to troubleshoot a bit
* absolutely an overkill if you want just an installation for fun with 50 friends
* without offsite backups, slightly higher risk of losing your data one day (backup automation might be added one day though)

## Before Installation - Prerequisites

* If on Windows, install WSL (preferably Debian)
* If on Linux, you should be good to go
* If on Mac, you might need to update bash and install homebrew

* You should have rudimentary knowledge of ssh, ssh keys, linux console, and how web works overall.
* You do not need any real knowledge of Kubernetes or Docker.
* You must buy a domain (or get a free subdomain) somewhere else that is not Hetzner.
* I will say "Hetzner" but you can get any machine anywhere. It honestly can be an old laptop running in your basement.
* You should buy a simple bare metal server from Hetzner. Anything with spare ~16GB RAM should work.
* 
