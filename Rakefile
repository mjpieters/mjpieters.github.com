require 'rubygems'
require 'bundler/setup'
Bundler.require(:default, :development, :jekyll_plugins)
require 'jekyll'

HERE = Pathname("./").expand_path
TEST_CACHE = HERE / ".cache" / "htmlproofer"
THEME_GEM = "minimal-mistakes-jekyll"
THEME_REMOTE = "mmistakes/minimal-mistakes"

JSFILE = HERE / "assets" / "js" / "_zopatista.js"
THEME_PATH = Pathname.new(Gem.loaded_specs[THEME_GEM].gem_dir)
THEME_MAINJS = THEME_PATH / "assets" / "js" / "main.min.js"
JSTARGET = JSFILE.dirname / THEME_MAINJS.basename

module SiteUtils
  @@_site = nil

  def SiteUtils.site()
    # retrieve the jekyll site, with config

    @@_site ||= begin
      options = Jekyll::Command.configuration_from_options(
        {:source => HERE.to_s}
      )
      Jekyll::Site.new(options)
    end
    return @@_site
  end

  def SiteUtils.run(serve=true)
    require 'listen'

    options = site().config.merge({
      :watch => serve,
      :serving => serve,
    }).merge( serve ? {:url => 'http://localhost:4000'} : {} )

    unless theme_uptodate
      Jekyll.logger.warn "Warning:",
                         "Remote theme version doesn't match gem version"
      Jekyll.logger.warn "",
                         "Gem: #{Gem.loaded_specs[THEME_GEM].version.to_s}"
      Jekyll.logger.warn "",
                         "Remote theme: #{options['remote_theme'].rpartition('@')[-1]}"
      Jekyll.logger.warn "",
                         "Run `rake theme:update` to update the remote theme version"
    end

    SiteUtils.uglifier
    Jekyll::Commands::Build.process(options)

    if serve
      # copy the JS file to the _site assets too, and prevent Jekyll from
      # clobbering it.
      js_relative = JSFILE.relative_path_from(HERE)
      js_assets = Pathname.new(options["destination"]) / js_relative.dirname
      FileUtils.cp(JSFILE, js_assets)
      options["keep_files"] << js_relative

      # look for JS updates and re-uglify and copy
      listener = Listen.to(
        JSFILE.dirname.to_s,
        only: Regexp.new(Regexp.escape(JSFILE.basename.to_s))
      ) do |modified, added, removed|
        SiteUtils.uglifier
        FileUtils.cp([JSFILE, JSTARGET], js_assets)
      end
      listener.start # not blocking

      Jekyll::Commands::Serve.process(options)
    end

  # rescue
  #   Jekyll.logger.error "Rake serve", "Exiting" 
  ensure
    listener.stop if serve and listener
  end

  def SiteUtils.theme_uptodate()
    # check if the remote theme matches the gem version
    config = site().config
    theme_name, _, theme_version = config["remote_theme"].rpartition("@")
    raise "Unexpected remote theme name #{theme_name}" unless theme_name == THEME_REMOTE
    gem_version = Gem.loaded_specs[THEME_GEM].version.to_s
    return theme_version == gem_version
  end

  def SiteUtils.uglifier()
    # uglify JS source, append to original main.min.js

    require "base64"
    require "json"
    require "uglifier"

    JSTARGET.open("w") do |file|
      count = File.foreach(THEME_MAINJS).inject(0) do |c, line|
        file.write(line.rstrip + "\n")
        c + 1
      end
      compressed, sourcemap = Uglifier.compile_with_map(
        JSFILE.read,
        :harmony => true,
        :source_map => { :filename => JSFILE.basename.to_s }
      )
      file.write(compressed.rstrip + "\n")
      
      # adjust source map line count, then write out as base64 data URL
      mapdata = JSON.parse(sourcemap)
      mapdata["mappings"] = ";" * count + mapdata["mappings"]
      b64sourcemap = Base64.strict_encode64(JSON.generate(mapdata))
      file.write("//# sourceMappingURL=data:application/json;charset=utf-8;base64,#{b64sourcemap}\n")
    end

    Jekyll.logger.info "JS:", "Compressed javascript"
  end
end

namespace :jekyll do
  desc "Build the site out"
  task :build do
    SiteUtils::run(serve=false)
  end

  task :serve do
    SiteUtils::run
  end
end

namespace :theme do
  desc "Update theme version in config"
  task :update do
    require 'psych'
    include SiteUtils
    if theme_uptodate
      puts "Remote theme up-to-date"
      return
    end

    gem_version = Gem.loaded_specs[THEME_GEM].version.to_s
    site().config.config_files({}).each do |fname|
      data = YAML.load_file(fname)
      if data["remote_theme"]
        data["remote_theme"] = "#{THEME_REMOTE}@#{gem_version}"
        File.open(fname, 'w') do |file|
          file.write(YAML.dump(data))
        end
      end    
    end
    Jekyll.logger.info("Updated remote theme to #{gem_version}")
  end

  desc "Uglify javascript code"
  task :uglify do
    SiteUtils::uglifier
  end
end


desc "Serve up the site (watching for changes)"
task :serve => "jekyll:serve"


desc "Check the site for linking issues"
task :test => "jekyll:build" do
  require 'html-proofer'

  options = {
  	:assume_extension => true,
  	:allow_hash_href => true,
  	:http_status_ignore => [999],  # because LinkedIn doesn't like being pinged
  	:check_html => true,
  	:check_img_http => true,
  	:check_opengraph => true,
    :parallel => {
      :in_processes => 3
    },
    :cache => {
      :storage_dir => TEST_CACHE.to_s,
      :timeframe => "30d",
    },
  }
  destination = SiteUtils::site().config["destination"]
  HTMLProofer.check_directory(destination, options).run
end
